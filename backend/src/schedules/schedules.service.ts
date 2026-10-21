import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SystemService } from '../system/system.service';
import { AppGateway } from '../websocket/app.gateway';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private systemService: SystemService,
    private gateway: AppGateway,
  ) {}

  async findAll() {
    return this.prisma.schedule.findMany({
      include: { area: { select: { id: true, name: true } } },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(data: {
    name: string; areaId?: string; startTime: string; endTime?: string;
    daysOfWeek?: string; sceneCode?: string; brightness?: number;
    colorTemperature?: number; power: boolean; enabled: boolean;
  }) {
    return this.prisma.schedule.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string; startTime: string; endTime: string;
    daysOfWeek: string; sceneCode: string; brightness: number;
    colorTemperature: number; power: boolean; enabled: boolean;
  }>) {
    return this.prisma.schedule.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.schedule.delete({ where: { id } });
  }

  // ── Cron: runs every minute ───────────────────────────────
  @Cron(CronExpression.EVERY_MINUTE)
  async runSchedules() {
    const now = new Date();
    // Vietnam time (+7)
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentTime = `${String(vnNow.getUTCHours()).padStart(2, '0')}:${String(vnNow.getUTCMinutes()).padStart(2, '0')}`;
    const dayOfWeek = vnNow.getUTCDay() || 7; // 1=Mon, 7=Sun

    const schedules = await this.prisma.schedule.findMany({
      where: { enabled: true, startTime: currentTime },
    });

    for (const sched of schedules) {
      const days = sched.daysOfWeek.split(',').map(Number);
      if (!days.includes(dayOfWeek)) continue;

      // Execute schedule
      if (sched.sceneCode) {
        const scene = await this.prisma.lightingScene.findUnique({ where: { code: sched.sceneCode } });
        if (scene) {
          const modeIndex = await this.prisma.lightingScene.count({ where: { sortOrder: { lt: scene.sortOrder } } });
          await this.systemService.setMode(modeIndex, 'scheduler');
        }
      }
      if (sched.brightness !== null) {
        await this.systemService.setBrightness(sched.brightness!, 'scheduler');
      }
      if (sched.colorTemperature !== null) {
        await this.systemService.setColorTemperature(sched.colorTemperature!, 'scheduler');
      }

      // Update lastExecutedAt
      await this.prisma.schedule.update({
        where: { id: sched.id },
        data: { lastExecutedAt: new Date() },
      });

      // Create alert
      const alert = await this.prisma.alert.create({
        data: {
          type: 'SCHEDULE_EXECUTED',
          severity: 'INFO',
          title: `Lịch tự động: ${sched.name}`,
          message: `Đã thực hiện lịch chiếu sáng lúc ${currentTime}`,
        },
      });
      this.gateway.broadcastScheduleExecuted({ schedule: sched, alert });
    }
  }
}
