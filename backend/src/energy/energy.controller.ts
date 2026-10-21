import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('energy')
export class EnergyController {
  constructor(private energyService: EnergyService) {}

  @Get('today') async getToday() { return { success: true, data: await this.energyService.getToday() }; }
  @Get('chart') async getChart(@Query('hours') hours?: string) {
    return { success: true, data: await this.energyService.getChartData(hours ? parseInt(hours) : 24) };
  }
  @Get('areas') async getByArea() { return { success: true, data: await this.energyService.getByArea() }; }
  @Get('report') async getReport(@Query('from') from: string, @Query('to') to: string) {
    const data = await this.energyService.getReport(new Date(from || Date.now() - 86400000), new Date(to || Date.now()));
    return { success: true, data };
  }
}
