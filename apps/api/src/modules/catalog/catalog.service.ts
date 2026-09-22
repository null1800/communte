import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  async listProducts(category?: string) {
    const filter = category ? `category=eq.${encodeURIComponent(category)}&` : '';
    return this.db.select<Record<string, unknown>>('products', `${filter}is_active=eq.true&order=name.asc`);
  }

  async getProduct(id: string) {
    const products = await this.db.select<Record<string, unknown>>('products', `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!products[0]) throw new NotFoundException('Product not found');
    return products[0];
  }

  async listTransformationSpecs(outputProductId?: string) {
    const filter = outputProductId ? `output_product_id=eq.${encodeURIComponent(outputProductId)}&` : '';
    return this.db.select<Record<string, unknown>>('transformation_specs', `${filter}is_active=eq.true&select=*`);
  }
}
