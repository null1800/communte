import { SettlementService } from './settlement.service';
import { DatabaseService } from '../database/database.service';

describe('SettlementService', () => {
  let service: SettlementService;
  let dbMock: Partial<DatabaseService>;

  beforeEach(() => {
    dbMock = {
      rpc: jest.fn(),
      select: jest.fn(),
    };
    service = new SettlementService(dbMock as DatabaseService);
  });

  it('should process multi-party settlement allocations via process_group_settlement RPC', async () => {
    const mockAllocations = [
      { id: 'alloc-1', allocation_type: 'PLATFORM_FEE', amount: 9.00 },
      { id: 'alloc-2', allocation_type: 'RAW_SUPPLY', amount: 171.00 },
    ];

    (dbMock.rpc as jest.Mock).mockResolvedValue(undefined);
    (dbMock.select as jest.Mock).mockResolvedValue(mockAllocations);

    const result = await service.processSettlementForTransaction('group-1', 'tx-100', 180.00);

    expect(dbMock.rpc).toHaveBeenCalledWith('process_group_settlement', {
      p_group_id: 'group-1',
      p_payment_transaction_id: 'tx-100',
      p_total_amount: 180.00,
    });
    expect(result).toEqual(mockAllocations);
  });

  it('should list allocations for a specific payment transaction', async () => {
    const mockAllocations = [{ id: 'alloc-1', allocation_type: 'PLATFORM_FEE', amount: 9.00 }];
    (dbMock.select as jest.Mock).mockResolvedValue(mockAllocations);

    const res = await service.listAllocationsForTransaction('tx-100');
    expect(res).toEqual(mockAllocations);
    expect(dbMock.select).toHaveBeenCalledWith(
      'settlement_allocations',
      'payment_transaction_id=eq.tx-100&select=*&order=created_at.asc'
    );
  });
});
