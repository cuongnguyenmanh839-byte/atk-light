import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Get()
  async findAll() {
    return { success: true, data: await this.schedulesService.findAll() };
  }

  @Post()
  @Roles('OPERATOR')
  async create(@Body() dto: any, @Request() req: any) {
    const schedule = await this.schedulesService.create(dto);
    return { success: true, data: schedule, message: 'Thêm lịch thành công' };
  }

  @Patch(':id')
  @Roles('OPERATOR')
  async update(@Param('id') id: string, @Body() dto: any) {
    const schedule = await this.schedulesService.update(id, dto);
    return { success: true, data: schedule };
  }

  @Delete(':id')
  @Roles('OPERATOR')
  async remove(@Param('id') id: string) {
    await this.schedulesService.delete(id);
    return { success: true, message: 'Xóa lịch thành công' };
  }
}
