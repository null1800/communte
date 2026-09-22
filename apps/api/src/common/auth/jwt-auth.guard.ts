import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC, AppRole } from './auth.decorators';
export interface AuthenticatedUser { id: string; roles: AppRole[]; }
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest(); const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('A bearer access token is required.');
    try { const p = await this.jwt.verifyAsync<{ sub: string; roles?: AppRole[] }>(token); request.user = { id: p.sub, roles: p.roles || [] } satisfies AuthenticatedUser; return true; }
    catch { throw new UnauthorizedException('Access token is invalid or expired.'); }
  }
}
