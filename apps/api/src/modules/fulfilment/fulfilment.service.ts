import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FulfilmentService {
  constructor(private readonly db: DatabaseService) {}

  async getDepotAllocations(collectionPointId: string) {
    const points = await this.db.select<Record<string, unknown>>(
      'collection_points',
      `id=eq.${encodeURIComponent(collectionPointId)}&select=*`
    );
    if (!points[0]) throw new NotFoundException('Collection point not found');

    const groups = await this.db.select<Record<string, unknown>>(
      'purchase_groups',
      `collection_point_id=eq.${encodeURIComponent(collectionPointId)}&select=id,title,status,target_quantity,committed_quantity,unit_price`
    );

    const groupIds = groups.map((g: any) => g.id);
    let allocations: Record<string, unknown>[] = [];

    if (groupIds.length > 0) {
      const memberships = await this.db.select<Record<string, unknown>>(
        'group_memberships',
        `group_id=in.(${groupIds.map(id => `"${id}"`).join(',')})&select=id,group_id,customer_user_id,requested_quantity,committed_quantity,status`
      );

      const membershipIds = memberships.map((m: any) => m.id);
      if (membershipIds.length > 0) {
        allocations = await this.db.select<Record<string, unknown>>(
          'customer_allocations',
          `membership_id=in.(${membershipIds.map(id => `"${id}"`).join(',')})&select=*&order=created_at.desc`
        );
      }
    }

    return {
      collectionPoint: points[0],
      groups,
      allocations,
    };
  }

  async verifyClaimCode(claimCode: string) {
    const formattedCode = claimCode.trim().toUpperCase();

    const existing = await this.db.select<Record<string, unknown>>(
      'customer_allocations',
      `claim_code=eq.${encodeURIComponent(formattedCode)}&select=*`
    );

    if (!existing[0]) {
      throw new NotFoundException('Invalid claim code');
    }

    const alloc = existing[0];
    if (alloc.status === 'CLAIMED') {
      throw new BadRequestException(`Claim code ${formattedCode} was already redeemed at ${alloc.claimed_at}`);
    }

    const updated = await this.db.update<Record<string, unknown>>(
      'customer_allocations',
      `id=eq.${alloc.id}`,
      { status: 'CLAIMED', claimed_at: new Date().toISOString() }
    );

    return {
      allocation: updated[0],
      message: 'Claim code verified successfully! Handover authorized.',
    };
  }
}
