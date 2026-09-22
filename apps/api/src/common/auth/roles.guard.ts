import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from './auth.decorators';
import { AuthenticatedUser } from './jwt-auth.guard';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>('roles', [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest().user as AuthenticatedUser;
    if (!user?.roles?.some((role) => required.includes(role))) throw new ForbiddenException('You do not have permission for this operation.');
    return true;
  }
}
