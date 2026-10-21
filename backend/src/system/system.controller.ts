import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';
import { getEsp32Config, setEsp32Config } from '../common/esp32';

import { Public } from '../auth/decorators/public.decorator';

class SetPowerDto { @IsBoolean() power: boolean; }
class SetBrightnessDto { @IsInt() @Min(0) @Max(100) brightness: number; }
class SetColorTempDto { @IsInt() @Min(3000) @Max(6000) colorTemperature: number; }
class SetModeDto { @IsInt() @Min(0) @Max(3) mode: number; }

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system')
export class SystemController {
  constructor(
    private systemService: SystemService,
    private auditLogs: AuditLogsService,
  ) {}

  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @Get('state')
  async getState() {
    return { success: true, data: await this.systemService.getState() };
  }

  @Get('energy/chart')
  async getEnergyChart() {
    return { success: true, data: await this.systemService.getEnergyChart() };
  }

  @Post('power')
  @Roles('OPERATOR')
  async setPower(@Body() dto: SetPowerDto, @Request() req: any) {
    const state = await this.systemService.getState();
    const result = await this.systemService.setPower(dto.power, req.user.sub);
    await this.auditLogs.log(
      req.user.sub,
      dto.power ? 'SYSTEM_POWER_ON' : 'SYSTEM_POWER_OFF',
      'system',
      'singleton',
      { power: state.power },
      { power: dto.power },
      req.ip,
    );
    return { success: true, data: result, message: dto.power ? 'Đã bật hệ thống' : 'Đã tắt hệ thống' };
  }

  @Patch('brightness')
  @Roles('OPERATOR')
  async setBrightness(@Body() dto: SetBrightnessDto, @Request() req: any) {
    const result = await this.systemService.setBrightness(dto.brightness, req.user.sub);
    await this.auditLogs.log(req.user.sub, 'BRIGHTNESS_CHANGE', 'system', 'singleton', undefined, dto, req.ip);
    return { success: true, data: result };
  }

  @Patch('color-temperature')
  @Roles('OPERATOR')
  async setColorTemp(@Body() dto: SetColorTempDto, @Request() req: any) {
    const result = await this.systemService.setColorTemperature(dto.colorTemperature, req.user.sub);
    await this.auditLogs.log(req.user.sub, 'COLOR_TEMP_CHANGE', 'system', 'singleton', undefined, dto, req.ip);
    return { success: true, data: result };
  }

  @Post('mode')
  @Roles('OPERATOR')
  async setMode(@Body() dto: SetModeDto, @Request() req: any) {
    const result = await this.systemService.setMode(dto.mode, req.user.sub);
    await this.auditLogs.log(req.user.sub, 'MODE_CHANGE', 'system', 'singleton', undefined, dto, req.ip);
    return { success: true, data: result };
  }

  @Get('esp32')
  getEsp32() {
    return { success: true, data: getEsp32Config() };
  }

  @Post('esp32')
  @Roles('OPERATOR')
  setEsp32(@Body() body: { url: string; token?: string }) {
    setEsp32Config(body.url, body.token);
    return { success: true, data: getEsp32Config() };
  }
}
