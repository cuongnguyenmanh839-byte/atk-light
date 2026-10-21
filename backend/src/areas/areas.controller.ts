import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AreasService } from './areas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

class SetPowerDto {
  @IsBoolean() power: boolean;
}
class SetBrightnessDto {
  @IsInt() @Min(0) @Max(100) brightness: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(
    private areasService: AreasService,
    private auditLogs: AuditLogsService,
  ) {}

  @Get()
  async findAll() {
    return { success: true, data: await this.areasService.findAll() };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.areasService.findOne(id) };
  }

  @Patch(':id/power')
  @Roles('OPERATOR')
  async setPower(@Param('id') id: string, @Body() dto: SetPowerDto, @Request() req: any) {
    const area = await this.areasService.findOne(id);
    const result = await this.areasService.setPower(id, dto.power, req.user.sub);
    await this.auditLogs.log(
      req.user.sub,
      dto.power ? 'AREA_POWER_ON' : 'AREA_POWER_OFF',
      'area',
      id,
      { power: area.power },
      { power: dto.power },
      req.ip,
    );
    return { success: true, data: result, message: `Đã ${dto.power ? 'bật' : 'tắt'} ${area.name}` };
  }

  @Patch(':id/brightness')
  @Roles('OPERATOR')
  async setBrightness(@Param('id') id: string, @Body() dto: SetBrightnessDto, @Request() req: any) {
    const result = await this.areasService.setBrightness(id, dto.brightness, req.user.sub);
    await this.auditLogs.log(req.user.sub, 'AREA_BRIGHTNESS', 'area', id, undefined, { brightness: dto.brightness }, req.ip);
    return { success: true, data: result };
  }
}
