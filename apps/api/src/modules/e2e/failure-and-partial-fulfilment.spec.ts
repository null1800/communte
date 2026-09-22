import { FulfilmentService } from '../fulfilment/fulfilment.service';
import { ProcessingService } from '../processing/processing.service';
import { SettlementService } from '../settlement/settlement.service';
import { OrderService } from '../order/order.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Attack Test Suite: Failure Modes, Partial Fulfilment & Security Safeguards', () => {
  let dbMock: jest.Mocked<DatabaseService>;
  let fulfilmentService: FulfilmentService;
  let processingService: ProcessingService;
  let settlementService: SettlementService;
  let orderService: OrderService;

  beforeEach(() => {
    dbMock = {
      rpc: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    fulfilmentService = new FulfilmentService(dbMock);
    processingService = new ProcessingService(dbMock);
    settlementService = new SettlementService(dbMock);
    orderService = new OrderService(dbMock);
  });

  describe('1. Security: Claim Code Fraud & Invalid Handover Attack', () => {
    it('should reject fake/unknown claim codes with NotFoundException and NEVER return mock authorization', async () => {
      dbMock.select.mockResolvedValueOnce([]);

      await expect(
        fulfilmentService.verifyClaimCode('FAKE-CLAIM-CODE-999')
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject already redeemed claim codes with BadRequestException', async () => {
      const mockAlreadyClaimed = {
        id: 'alloc-claimed-1',
        claim_code: 'CU-CLAIMED88',
        status: 'CLAIMED',
        claimed_at: '2026-09-22T10:00:00Z',
      };
      dbMock.select.mockResolvedValueOnce([mockAlreadyClaimed]);

      await expect(
        fulfilmentService.verifyClaimCode('CU-CLAIMED88')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Processing QA Failure & State Machine Breakdown', () => {
    it('should mark processing batch as QA_FAILED and trigger group failure status transition', async () => {
      const mockBatch = {
        id: 'batch-001',
        status: 'QA_FAILED',
        qa_notes: 'Moisture content too high; failed grade test',
      };

      dbMock.update.mockResolvedValueOnce([mockBatch]);
      dbMock.rpc.mockResolvedValueOnce({ id: 'grp-mealie-001', status: 'FAILED' });

      const res = await processingService.updateBatchStatus(
        'batch-001',
        'grp-mealie-001',
        'QA_FAILED',
        'Moisture content too high; failed grade test'
      );

      expect(res.status).toBe('QA_FAILED');
      expect(dbMock.rpc).toHaveBeenCalledWith('mark_group_failed_rpc', {
        p_group_id: 'grp-mealie-001',
        p_reason: 'Moisture content too high; failed grade test',
      });
    });
  });

  describe('3. Financial Settlement Validation & Guardrails', () => {
    it('should reject zero or negative settlement amounts', async () => {
      await expect(
        settlementService.processSettlementForTransaction('grp-001', 'tx-001', 0)
      ).rejects.toThrow(BadRequestException);

      await expect(
        settlementService.processValueChainSettlement('grp-001', 'tx-002', -500)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Idempotent Order Creation for Resolved Groups', () => {
    it('should invoke create_group_order_rpc for group order creation', async () => {
      const mockOrder = {
        id: 'ord-001',
        group_id: 'grp-001',
        quantity: 100,
        total_amount: 18000,
      };

      dbMock.rpc.mockResolvedValueOnce(mockOrder);

      const res = await orderService.createOrderForGroup('grp-001');

      expect(res).toEqual(mockOrder);
      expect(dbMock.rpc).toHaveBeenCalledWith('create_group_order_rpc', {
        p_group_id: 'grp-001',
      });
    });
  });
});
