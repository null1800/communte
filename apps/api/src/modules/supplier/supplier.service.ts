import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupplierService {
  constructor(private readonly db: DatabaseService) {}

  async getProfile(actorUserId: string) {
    const suppliers = await this.db.select<Record<string, unknown>>(
      'supplier_profiles',
      `user_id=eq.${encodeURIComponent(actorUserId)}&select=*`,
    );
    if (!suppliers[0]) {
      // Auto-create active supplier profile for authenticated supplier role
      const created = await this.db.insert<Record<string, unknown>>('supplier_profiles', {
        user_id: actorUserId,
        legal_name: 'Registered Supplier',
        contact_phone: '+260970000000',
        contact_email: 'supplier@communte.com',
        address: 'Lusaka Wholesale Hub, Zambia',
        status: 'ACTIVE',
      });
      return created[0];
    }
    return suppliers[0];
  }

  async getDemand(actorUserId: string) {
    const supplier = await this.getProfile(actorUserId);
    const supplierId = supplier.id as string;

    const offers = await this.db.select<Record<string, unknown>>(
      'product_offers',
      `supplier_profile_id=eq.${encodeURIComponent(supplierId)}&select=*,products(*)`,
    );

    const offerIds = offers.map((o) => o.id as string);
    if (offerIds.length === 0) {
      return { supplierId, offers: [], totalDemandUnits: 0, totalCommittedValue: 0, activeGroupsCount: 0 };
    }

    const groups = await this.db.select<Record<string, unknown>>(
      'purchase_groups',
      `product_offer_id=in.(${offerIds.join(',')})&select=*`,
    );

    let totalDemandUnits = 0;
    let totalCommittedValue = 0;

    const offersWithDemand = offers.map((offer) => {
      const offerGroups = groups.filter((g) => g.product_offer_id === offer.id);
      const offerCommittedUnits = offerGroups.reduce((acc, g) => acc + Number(g.committed_quantity || 0), 0);
      const offerUnitPrice = Number(offer.unit_price || 0);

      totalDemandUnits += offerCommittedUnits;
      totalCommittedValue += offerCommittedUnits * offerUnitPrice;

      return {
        ...offer,
        active_groups_count: offerGroups.length,
        total_committed_units: offerCommittedUnits,
        total_committed_value: offerCommittedUnits * offerUnitPrice,
        groups: offerGroups,
      };
    });

    return {
      supplierId,
      supplierName: supplier.legal_name,
      offers: offersWithDemand,
      totalDemandUnits,
      totalCommittedValue,
      activeGroupsCount: groups.length,
    };
  }
}
