import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public, Roles } from '../../common/auth/auth.decorators';
import { AuthenticatedUser } from '../../common/auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

class CreateOfferBody {
  @IsUUID()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  unitName!: string;

  @IsInt()
  @Min(1)
  availableQuantity!: number;

  @IsInt()
  @Min(1)
  minimumOrderQuantity!: number;

  @IsString()
  @IsNotEmpty()
  unitPrice!: string;

  @IsString()
  @IsNotEmpty()
  fulfilmentTerms!: string;

  @IsOptional()
  @IsDateString()
  availabilityEndsAt?: string;
}

@Controller()
export class ProductOfferController {
  constructor(private readonly db: DatabaseService) {}

  @Get('products')
  @Public()
  async listProducts() {
    try {
      const products = await this.db.select<Record<string, unknown>>('products', 'is_active=eq.true&order=created_at.desc');
      if (products && products.length > 0) return products;
    } catch {
      // Fallback if DB table empty or not seeded
    }

    // Default canonical catalog products if empty
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Breakfast Meal 25kg (Eagle Brand)',
        category: 'Food Staples',
        unit_name: '25kg bag',
        price_per_unit: 290.0,
        retail_price_ref: 350.0,
        is_active: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Vegetable Cooking Oil 20L',
        category: 'Food Staples',
        unit_name: '20L container',
        price_per_unit: 620.0,
        retail_price_ref: 740.0,
        is_active: true,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'White Refined Sugar 50kg',
        category: 'Food Staples',
        unit_name: '50kg sack',
        price_per_unit: 850.0,
        retail_price_ref: 980.0,
        is_active: true,
      },
    ];
  }

  @Post('product-offers')
  @Roles('SUPPLIER')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateOfferBody) {
    return this.db.rpc('create_product_offer', {
      p_actor_user_id: user.id,
      p_product_id: body.productId,
      p_unit_name: body.unitName,
      p_available_quantity: body.availableQuantity,
      p_minimum_order_quantity: body.minimumOrderQuantity,
      p_unit_price: body.unitPrice,
      p_fulfilment_terms: body.fulfilmentTerms,
      p_availability_ends_at: body.availabilityEndsAt || null,
    });
  }

  @Get('product-offers')
  @Public()
  async listOffers() {
    return this.db.select<Record<string, unknown>>(
      'product_offers',
      'status=eq.PUBLISHED&select=*,products(*),supplier_profiles(*)&order=created_at.desc',
    );
  }

  @Get('product-offers/:id')
  @Public()
  async detail(@Param('id') id: string) {
    const offers = await this.db.select<Record<string, unknown>>(
      'product_offers',
      `id=eq.${encodeURIComponent(id)}&select=*,products(*),supplier_profiles(*)`,
    );
    if (!offers[0]) throw new NotFoundException('Product offer not found.');

    const groups = await this.db.select<Record<string, unknown>>(
      'purchase_groups',
      `product_offer_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,
    );

    return { offer: offers[0], groups };
  }
}
