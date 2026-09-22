import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateShipmentInput {
  demandGroupId: string;
  carrierPartyId?: string;
  originAddress: string;
  destinationCollectionPointId: string;
  quantityUnits: number;
}

@Injectable()
export class ShipmentService {
  constructor(private readonly db: DatabaseService) {}

  async createShipment(input: CreateShipmentInput) {
    const trackingNumber = 'TRK-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const rows = await this.db.insert<Record<string, unknown>>('shipments', {
      demand_group_id: input.demandGroupId,
      carrier_party_id: input.carrierPartyId || null,
      origin_address: input.originAddress,
      destination_collection_point_id: input.destinationCollectionPointId,
      quantity_units: input.quantityUnits,
      status: 'IN_TRANSIT',
      tracking_number: trackingNumber,
      dispatched_at: new Date().toISOString(),
    });
    return rows[0];
  }

  async listForGroup(demandGroupId: string) {
    return this.db.select<Record<string, unknown>>(
      'shipments',
      `demand_group_id=eq.${encodeURIComponent(demandGroupId)}&select=*`
    );
  }

  async updateStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'RECEIVED' || status === 'ARRIVED') {
      patch.delivered_at = new Date().toISOString();
    }
    const rows = await this.db.update<Record<string, unknown>>('shipments', `id=eq.${encodeURIComponent(id)}`, patch);
    if (!rows[0]) throw new NotFoundException('Shipment not found');
    return rows[0];
  }
}
