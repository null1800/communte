import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/auth/auth.decorators';

@Controller('health')
export class HealthController {
  @Get('live') @Public() live() { return { status: 'ok' }; }
  @Get('ready') @Public() ready() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.JWT_SECRET) {
      throw new ServiceUnavailableException('Required production configuration is missing.');
    }
    return { status: 'ready' };
  }
}
