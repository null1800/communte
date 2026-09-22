import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public, Roles } from '../../common/auth/auth.decorators';
import { AuthenticatedUser } from '../../common/auth/jwt-auth.guard';
import { GroupService } from './group.service';

enum FulfillmentModeEnum {
  MODEL_A_DIRECT = 'MODEL_A_DIRECT',
  MODEL_B_VALUE_CHAIN = 'MODEL_B_VALUE_CHAIN',
}

class CreateGroupBody {
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() productOfferId?: string;
  @IsOptional() @IsUUID() collectionPointId?: string;
  @IsString() @IsNotEmpty() title!: string;
  @IsInt() @Min(1) targetQuantity!: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsString() collectionPoint?: string;
  @IsDateString() closesAt!: string;
  @IsOptional() @IsEnum(FulfillmentModeEnum) fulfillmentMode?: FulfillmentModeEnum;
}

class CommitBody {
  @IsInt() @Min(1) requestedQuantity!: number;
  @IsUUID() idempotencyKey!: string;
}

@Controller('groups')
export class GroupController {
  constructor(private readonly groups: GroupService) {}

  @Post()
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateGroupBody) {
    return this.groups.create(user.id, body);
  }

  @Get()
  @Public()
  list(@Query('productOfferId') offerId?: string, @Query('productId') productId?: string) {
    return this.groups.list(offerId, productId);
  }

  @Get(':id')
  @Public()
  detail(@Param('id') id: string) {
    return this.groups.detail(id);
  }

  @Post(':id/commitments')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  commit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CommitBody) {
    return this.groups.commit(user.id, id, body.requestedQuantity, body.idempotencyKey);
  }

  @Post(':id/fund')
  @Roles('CUSTOMER', 'SUPPLIER', 'ADMIN')
  fund(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.groups.fundGroup(id, user.id);
  }
}
