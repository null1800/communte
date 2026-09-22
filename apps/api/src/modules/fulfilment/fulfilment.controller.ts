import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { Public, Roles } from '../../common/auth/auth.decorators';
import { FulfilmentService } from './fulfilment.service';

class VerifyClaimDto {
  @IsString() @IsNotEmpty() claimCode!: string;
}

@Controller('fulfilment')
export class FulfilmentController {
  constructor(private readonly fulfilmentService: FulfilmentService) {}

  @Get('depot/:id')
  @Public()
  getDepotAllocations(@Param('id') collectionPointId: string) {
    return this.fulfilmentService.getDepotAllocations(collectionPointId);
  }

  @Post('claim/verify')
  @Roles('SUPPLIER', 'ADMIN', 'CUSTOMER')
  verifyClaimCode(@Body() body: VerifyClaimDto) {
    return this.fulfilmentService.verifyClaimCode(body.claimCode);
  }
}
