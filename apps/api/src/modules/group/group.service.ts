import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateHybridGroupInput {
  productId?: string;
  productOfferId?: string;
  collectionPointId?: string;
  title: string;
  targetQuantity: number;
  unitPrice?: number;
  collectionPoint?: string;
  closesAt: string;
  fulfillmentMode?: 'MODEL_A_DIRECT' | 'MODEL_B_VALUE_CHAIN';
}

@Injectable()
export class GroupService {
  constructor(private readonly db: DatabaseService) {}

  async create(actorId: string, input: CreateHybridGroupInput) {
    if (input.productId || input.fulfillmentMode === 'MODEL_B_VALUE_CHAIN' || input.collectionPointId) {
      return this.db.rpc('create_hybrid_demand_group', {
        p_actor_user_id: actorId,
        p_product_id: input.productId || null,
        p_product_offer_id: input.productOfferId || null,
        p_collection_point_id: input.collectionPointId || null,
        p_title: input.title,
        p_target_quantity: input.targetQuantity,
        p_unit_price: input.unitPrice || 0,
        p_closes_at: input.closesAt,
        p_fulfillment_mode: input.fulfillmentMode || 'MODEL_A_DIRECT',
      });
    }

    return this.db.rpc('create_purchase_group', {
      p_actor_user_id: actorId,
      p_product_offer_id: input.productOfferId,
      p_title: input.title,
      p_target_quantity: input.targetQuantity,
      p_collection_point: input.collectionPoint || 'Central Depot',
      p_closes_at: input.closesAt,
    });
  }

  async commit(actorId: string, groupId: string, requestedQuantity: number, idempotencyKey: string) {
    try {
      return await this.db.rpc('commit_group_membership', {
        p_actor_user_id: actorId,
        p_group_id: groupId,
        p_requested_quantity: requestedQuantity,
        p_idempotency_key: idempotencyKey,
      });
    } catch (error: any) {
      const message = error.message || 'Could not commit to this group.';
      if (message.includes('not found')) throw new NotFoundException(message);
      throw new BadRequestException(message);
    }
  }

  list(offerId?: string, productId?: string) {
    let filter = '';
    if (offerId) filter += `product_offer_id=eq.${encodeURIComponent(offerId)}&`;
    if (productId) filter += `product_id=eq.${encodeURIComponent(productId)}&`;
    return this.db.select<Record<string, unknown>>('purchase_groups', `${filter}select=*&order=created_at.desc`);
  }

  async detail(id: string) {
    const groups = await this.db.select<Record<string, unknown>>('purchase_groups', `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!groups[0]) throw new NotFoundException('Group not found.');
    const memberships = await this.db.select<Record<string, unknown>>(
      'group_memberships',
      `group_id=eq.${encodeURIComponent(id)}&select=id,requested_quantity,committed_quantity,status,created_at`
    );
    return { group: groups[0], memberships };
  }

  async fundGroup(groupId: string, actorId?: string) {
    return this.db.rpc('fund_demand_group_and_allocate', {
      p_group_id: groupId,
      p_actor_user_id: actorId || null,
    });
  }
}
