import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseService } from './modules/database/database.service';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { GroupService } from './modules/group/group.service';
import { SupplierService } from './modules/supplier/supplier.service';
import { OrderService } from './modules/order/order.service';
import { CollectionPointService } from './modules/collection-point/collection-point.service';
import { CatalogService } from './modules/catalog/catalog.service';
import { SettlementService } from './modules/settlement/settlement.service';
import { FulfilmentService } from './modules/fulfilment/fulfilment.service';
import { SupplyContractService } from './modules/supply-contract/supply-contract.service';
import { ProcessingService } from './modules/processing/processing.service';
import { ShipmentService } from './modules/shipment/shipment.service';

// Controllers
import { AuthController } from './modules/auth/auth.controller';
import { ProductOfferController } from './modules/product-offer/product-offer.controller';
import { GroupController } from './modules/group/group.controller';
import { SupplierController } from './modules/supplier/supplier.controller';
import { OrderController } from './modules/order/order.controller';
import { HealthController } from './modules/health/health.controller';
import { CollectionPointController } from './modules/collection-point/collection-point.controller';
import { CatalogController } from './modules/catalog/catalog.controller';
import { SettlementController } from './modules/settlement/settlement.controller';
import { FulfilmentController } from './modules/fulfilment/fulfilment.controller';
import { SupplyContractController } from './modules/supply-contract/supply-contract.controller';
import { ProcessingController } from './modules/processing/processing.controller';
import { ShipmentController } from './modules/shipment/shipment.controller';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.AUTH_DEV_MODE !== 'true') {
  throw new Error('JWT_SECRET is required unless AUTH_DEV_MODE=true.');
}

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 600000,
        limit: 100,
      },
    ]),
    JwtModule.register({ secret: jwtSecret || 'development-only-secret', signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [
    AuthController,
    ProductOfferController,
    GroupController,
    SupplierController,
    OrderController,
    HealthController,
    CollectionPointController,
    CatalogController,
    SettlementController,
    FulfilmentController,
    SupplyContractController,
    ProcessingController,
    ShipmentController,
  ],
  providers: [
    DatabaseService,
    GroupService,
    SupplierService,
    OrderService,
    CollectionPointService,
    CatalogService,
    SettlementService,
    FulfilmentService,
    SupplyContractService,
    ProcessingService,
    ShipmentService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
