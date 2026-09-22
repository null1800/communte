import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNumber, IsUUID, Min } from 'class-validator';
import { Roles } from '../../common/auth/auth.decorators';
import { SettlementService } from './settlement.service';

class ProcessSettlementDto {
  @IsUUID() groupId!: string;
  @IsUUID() transactionId!: string;
  @IsNumber() @Min(0.01) amount!: number;
}

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('transaction/:id')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  getAllocations(@Param('id') transactionId: string) {
    return this.settlementService.listAllocationsForTransaction(transactionId);
  }

  @Post('process')
  @Roles('ADMIN')
  processSettlement(@Body() body: ProcessSettlementDto) {
    return this.settlementService.processSettlementForTransaction(body.groupId, body.transactionId, body.amount);
  }
}
