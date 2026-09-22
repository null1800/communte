import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SettlementService {
  constructor(private readonly db: DatabaseService) {}

  async listAllocationsForTransaction(transactionId: string) {
    return this.db.select<Record<string, unknown>>(
      'settlement_allocations',
      `payment_transaction_id=eq.${encodeURIComponent(transactionId)}&select=*&order=created_at.asc`
    );
  }

  async processSettlementForTransaction(groupId: string, transactionId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Settlement amount must be positive');
    await this.db.rpc('process_group_settlement', {
      p_group_id: groupId,
      p_payment_transaction_id: transactionId,
      p_total_amount: amount,
    });
    return this.listAllocationsForTransaction(transactionId);
  }

  async processValueChainSettlement(
    groupId: string,
    transactionId: string,
    amount: number,
    farmerPartyId?: string,
    processorPartyId?: string,
    carrierPartyId?: string,
    depotPartyId?: string
  ) {
    if (amount <= 0) throw new BadRequestException('Settlement amount must be positive');
    await this.db.rpc('process_value_chain_settlement', {
      p_group_id: groupId,
      p_payment_transaction_id: transactionId,
      p_total_amount: amount,
      p_farmer_party_id: farmerPartyId || null,
      p_processor_party_id: processorPartyId || null,
      p_carrier_party_id: carrierPartyId || null,
      p_depot_party_id: depotPartyId || null,
    });
    return this.listAllocationsForTransaction(transactionId);
  }
}
