import { SetMetadata } from '@nestjs/common';
export type AppRole = 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const Roles = (...roles: AppRole[]) => SetMetadata('roles', roles);
