import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateSupplyContractInput {
  demandGroupId: string;
  partyProfileId: string;
  productId: string;
  contractedQuantity: number;
  unitPrice: number;
}

@Injectable()
export class SupplyContractService {
  constructor(private readonly db: DatabaseService) {}

  async createContract(input: CreateSupplyContractInput) {
    return this.db.rpc('create_supply_contract_rpc', {
      p_demand_group_id: input.demandGroupId,
      p_party_profile_id: input.partyProfileId,
      p_product_id: input.productId,
      p_contracted_quantity: input.contractedQuantity,
      p_unit_price: input.unitPrice,
    });
  }

  async listForGroup(demandGroupId: string) {
    return this.db.select<Record<string, unknown>>(
      'supply_contracts',
      `demand_group_id=eq.${encodeURIComponent(demandGroupId)}&select=*`
    );
  }
}
