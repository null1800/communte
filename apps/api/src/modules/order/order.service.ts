import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OrderService {
  constructor(private readonly db: DatabaseService) {}

  async list(actorUserId: string, role: string) {
    if (role === 'SUPPLIER') {
      const suppliers = await this.db.select<Record<string, unknown>>(
        'supplier_profiles',
        `user_id=eq.${encodeURIComponent(actorUserId)}&select=id`,
      );
      if (!suppliers[0]) return [];
      const supplierId = suppliers[0].id as string;
      return this.db.select<Record<string, unknown>>(
        'group_orders',
        `supplier_profile_id=eq.${encodeURIComponent(supplierId)}&select=*,fulfilments(*),purchase_groups(*,product_offers(*,products(*)))&order=created_at.desc`,
      );
    } else {
      // Customer orders via group memberships
      const memberships = await this.db.select<Record<string, unknown>>(
        'group_memberships',
        `customer_user_id=eq.${encodeURIComponent(actorUserId)}&select=group_id`,
      );
      const groupIds = memberships.map((m) => m.group_id as string);
      if (groupIds.length === 0) return [];
      return this.db.select<Record<string, unknown>>(
        'group_orders',
        `group_id=in.(${groupIds.join(',')})&select=*,fulfilments(*),purchase_groups(*,product_offers(*,products(*)))&order=created_at.desc`,
      );
    }
  }

  async updateFulfilmentStatus(orderId: string, status: string, actorUserId: string) {
    const orders = await this.db.select<Record<string, unknown>>(
      'group_orders',
      `id=eq.${encodeURIComponent(orderId)}&select=*,supplier_profiles!inner(user_id)`,
    );
    if (!orders[0]) throw new NotFoundException('Order not found.');

    const supplierUserId = (orders[0].supplier_profiles as any)?.user_id;
    if (supplierUserId !== actorUserId) {
      throw new BadRequestException('You do not own this order.');
    }

    const updated = await this.db.update<Record<string, unknown>>(
      'fulfilments',
      `order_id=eq.${encodeURIComponent(orderId)}`,
      { status, updated_at: new Date().toISOString() },
    );
    return updated[0] || { orderId, status };
  }

  async createOrderForGroup(groupId: string) {
    return this.db.rpc('create_group_order_rpc', {
      p_group_id: groupId,
    });
  }
}
