import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Roles } from '../../common/auth/auth.decorators';
import { AuthenticatedUser } from '../../common/auth/jwt-auth.guard';
import { OrderService } from './order.service';

class UpdateFulfilmentBody {
  @IsString()
  @IsIn(['PENDING', 'READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED', 'FAILED'])
  status!: string;
}

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles('CUSTOMER', 'SUPPLIER')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.orderService.list(user.id, user.roles[0]);
  }

  @Patch(':id/fulfilment')
  @Roles('SUPPLIER')
  updateFulfilment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
    @Body() body: UpdateFulfilmentBody,
  ) {
    return this.orderService.updateFulfilmentStatus(orderId, body.status, user.id);
  }
}
