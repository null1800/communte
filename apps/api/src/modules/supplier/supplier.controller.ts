import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Roles } from '../../common/auth/auth.decorators';
import { AuthenticatedUser } from '../../common/auth/jwt-auth.guard';
import { SupplierService } from './supplier.service';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get('profile')
  @Roles('SUPPLIER')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.supplierService.getProfile(user.id);
  }

  @Get('demand')
  @Roles('SUPPLIER')
  getDemand(@CurrentUser() user: AuthenticatedUser) {
    return this.supplierService.getDemand(user.id);
  }
}
