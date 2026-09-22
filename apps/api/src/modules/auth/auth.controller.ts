import { Body, Controller, ForbiddenException, Get, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsArray, IsUUID } from 'class-validator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public, AppRole } from '../../common/auth/auth.decorators';
import { AuthenticatedUser } from '../../common/auth/jwt-auth.guard';
class DevelopmentTokenBody { @IsUUID() userId!: string; @IsArray() roles!: AppRole[]; }
@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}
  @Get('me') getProfile(@CurrentUser() user: AuthenticatedUser) { return user; }
  /** Deliberately unavailable in deployed environments; use the identity provider there. */
  @Post('development-token') @Public() async developmentToken(@Body() body: DevelopmentTokenBody) {
    if (process.env.AUTH_DEV_MODE !== 'true') throw new ForbiddenException('Development token issuance is disabled.');
    return { accessToken: await this.jwt.signAsync({ sub: body.userId, roles: body.roles }) };
  }
}
