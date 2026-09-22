import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CollectionPointService {
  constructor(private readonly db: DatabaseService) {}

  async create(input: { name: string; address: string; operatorUserId?: string; capacityUnits?: number; latitude?: number; longitude?: number }) {
    const result = await this.db.insert<Record<string, unknown>>('collection_points', {
      name: input.name,
      address: input.address,
      operator_user_id: input.operatorUserId || null,
      capacity_units: input.capacityUnits || 1000,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      is_active: true,
    });
    return result[0];
  }

  async list() {
    return this.db.select<Record<string, unknown>>('collection_points', 'is_active=eq.true&order=name.asc');
  }

  async detail(id: string) {
    const points = await this.db.select<Record<string, unknown>>('collection_points', `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!points[0]) throw new NotFoundException('Collection point not found');
    return points[0];
  }
}
