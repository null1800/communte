import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { Roles } from '../../common/auth/auth.decorators';
import { SupplyContractService } from './supply-contract.service';

class CreateSupplyContractBody {
  @IsUUID() demandGroupId!: string;
  @IsUUID() partyProfileId!: string;
  @IsUUID() productId!: string;
  @IsInt() @Min(1) contractedQuantity!: number;
  @IsNumber() @Min(0.01) unitPrice!: number;
}

@Controller('supply-contracts')
export class SupplyContractController {
  constructor(private readonly service: SupplyContractService) {}

  @Post()
  @Roles('SUPPLIER', 'ADMIN')
  create(@Body() body: CreateSupplyContractBody) {
    return this.service.createContract(body);
  }

  @Get('group/:demandGroupId')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  listForGroup(@Param('demandGroupId') demandGroupId: string) {
    return this.service.listForGroup(demandGroupId);
  }
}
