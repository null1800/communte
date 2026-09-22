import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsNumber, IsUUID, Min } from 'class-validator';
import { Roles } from '../../common/auth/auth.decorators';
import { ProcessingService } from './processing.service';

class CreateProcessingBody {
  @IsUUID() demandGroupId!: string;
  @IsUUID() processorPartyId!: string;
  @IsUUID() transformationSpecId!: string;
  @IsInt() @Min(1) inputQuantity!: number;
  @IsInt() @Min(1) outputQuantity!: number;
  @IsNumber() @Min(0) millingFee!: number;
}

@Controller('processing')
export class ProcessingController {
  constructor(private readonly service: ProcessingService) {}

  @Post('orders')
  @Roles('SUPPLIER', 'ADMIN')
  create(@Body() body: CreateProcessingBody) {
    return this.service.createOrderAndBatch(body);
  }

  @Get('group/:demandGroupId')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  listForGroup(@Param('demandGroupId') demandGroupId: string) {
    return this.service.listForGroup(demandGroupId);
  }
}
