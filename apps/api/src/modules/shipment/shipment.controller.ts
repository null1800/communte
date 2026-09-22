import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Roles } from '../../common/auth/auth.decorators';
import { ShipmentService } from './shipment.service';

class CreateShipmentBody {
  @IsUUID() demandGroupId!: string;
  @IsOptional() @IsUUID() carrierPartyId?: string;
  @IsString() @IsNotEmpty() originAddress!: string;
  @IsUUID() destinationCollectionPointId!: string;
  @IsInt() @Min(1) quantityUnits!: number;
}

class UpdateShipmentStatusBody {
  @IsString() @IsNotEmpty() status!: string;
}

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly service: ShipmentService) {}

  @Post()
  @Roles('SUPPLIER', 'ADMIN')
  create(@Body() body: CreateShipmentBody) {
    return this.service.createShipment(body);
  }

  @Get('group/:demandGroupId')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  listForGroup(@Param('demandGroupId') demandGroupId: string) {
    return this.service.listForGroup(demandGroupId);
  }

  @Patch(':id/status')
  @Roles('SUPPLIER', 'ADMIN')
  updateStatus(@Param('id') id: string, @Body() body: UpdateShipmentStatusBody) {
    return this.service.updateStatus(id, body.status);
  }
}
