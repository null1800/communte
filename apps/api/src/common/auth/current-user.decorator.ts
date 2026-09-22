import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './jwt-auth.guard';
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedUser => context.switchToHttp().getRequest().user);
