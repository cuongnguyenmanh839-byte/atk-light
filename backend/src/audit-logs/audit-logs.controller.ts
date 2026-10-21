import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return { success: true, data: await this.auditLogsService.findAll(200) };
  }
}
