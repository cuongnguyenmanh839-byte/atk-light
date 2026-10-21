import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  async findAll(@Query('unread') unread?: string) {
    const data = await this.alertsService.findAll(100, unread === 'true');
    return { success: true, data };
  }

  @Patch(':id/acknowledge')
  async acknowledge(@Param('id') id: string, @Request() req: any) {
    const alert = await this.alertsService.acknowledge(id, req.user.sub);
    return { success: true, data: alert };
  }

  @Patch('acknowledge-all')
  async acknowledgeAll(@Request() req: any) {
    await this.alertsService.acknowledgeAll(req.user.sub);
    return { success: true, message: 'Đã xác nhận tất cả cảnh báo' };
  }
}
