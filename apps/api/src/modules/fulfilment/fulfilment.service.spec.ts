import { FulfilmentService } from './fulfilment.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FulfilmentService', () => {
  let service: FulfilmentService;
  let dbMock: Partial<DatabaseService>;

  beforeEach(() => {
    dbMock = {
      select: jest.fn(),
      update: jest.fn(),
    };
    service = new FulfilmentService(dbMock as DatabaseService);
  });

  it('should verify unclaimed claim code and update status to CLAIMED', async () => {
    const mockAlloc = { id: 'alloc-99', claim_code: 'CLAIM-123', status: 'UNCLAIMED' };
    const mockUpdated = { id: 'alloc-99', claim_code: 'CLAIM-123', status: 'CLAIMED' };

    (dbMock.select as jest.Mock).mockResolvedValue([mockAlloc]);
    (dbMock.update as jest.Mock).mockResolvedValue([mockUpdated]);

    const res = await service.verifyClaimCode('CLAIM-123');
    expect(res.allocation).toEqual(mockUpdated);
    expect(dbMock.update).toHaveBeenCalledWith('customer_allocations', 'id=eq.alloc-99', expect.objectContaining({
      status: 'CLAIMED',
    }));
  });

  it('should throw BadRequestException if claim code is already CLAIMED', async () => {
    const mockAlloc = { id: 'alloc-99', claim_code: 'CLAIM-123', status: 'CLAIMED', claimed_at: '2026-09-22T12:00:00Z' };
    (dbMock.select as jest.Mock).mockResolvedValue([mockAlloc]);

    await expect(service.verifyClaimCode('CLAIM-123')).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when DB has no record for claim code', async () => {
    (dbMock.select as jest.Mock).mockResolvedValue([]);

    await expect(service.verifyClaimCode('CLAIM-MEALIE-001')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException for unknown invalid claim codes', async () => {
    (dbMock.select as jest.Mock).mockResolvedValue([]);

    await expect(service.verifyClaimCode('INV')).rejects.toThrow(NotFoundException);
  });
});
