import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnergyService {
  constructor(private prisma: PrismaService) {}

  async getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const [todaySum, yesterdaySum] = await Promise.all([
      this.prisma.energyRecord.aggregate({
        where: { recordedAt: { gte: today }, areaId: null },
        _sum: { energy: true },
      }),
      this.prisma.energyRecord.aggregate({
        where: { recordedAt: { gte: yesterday, lt: today }, areaId: null },
        _sum: { energy: true },
      }),
    ]);

    const todayKwh = todaySum._sum.energy ?? 0;
    const yesterdayKwh = yesterdaySum._sum.energy ?? 0;
    const change = yesterdayKwh > 0 ? ((todayKwh - yesterdayKwh) / yesterdayKwh * 100) : 0;

    return { today: todayKwh, yesterday: yesterdayKwh, change: Math.round(change * 10) / 10 };
  }

  async getChartData(hours = 24) {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const records = await this.prisma.energyRecord.findMany({
      where: { recordedAt: { gte: from }, areaId: null, deviceId: null },
      orderBy: { recordedAt: 'asc' },
    });

    const byHour: Record<string, number> = {};
    for (let h = 0; h <= 24; h++) {
      const label = h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`;
      byHour[label] = 0;
    }
    for (const r of records) {
      const h = r.recordedAt.getHours();
      const label = `${String(h).padStart(2, '0')}:00`;
      byHour[label] = (byHour[label] || 0) + r.energy;
    }
    return Object.entries(byHour).map(([time, value]) => ({ time, value: Math.round(value * 10) / 10 }));
  }

  async getByArea() {
    const areas = await this.prisma.area.findMany();
    const today = new Date(); today.setHours(0,0,0,0);
    const results = await Promise.all(areas.map(async (area) => {
      const sum = await this.prisma.energyRecord.aggregate({
        where: { areaId: area.id, recordedAt: { gte: today } },
        _sum: { energy: true },
      });
      return { areaId: area.id, areaName: area.name, energy: sum._sum.energy ?? 0 };
    }));
    return results;
  }

  async getReport(from: Date, to: Date) {
    const records = await this.prisma.energyRecord.findMany({
      where: { recordedAt: { gte: from, lte: to }, areaId: null, deviceId: null },
      orderBy: { recordedAt: 'asc' },
    });
    const total = records.reduce((sum, r) => sum + r.energy, 0);
    const auditCount = await this.prisma.auditLog.count({
      where: { createdAt: { gte: from, lte: to } },
    });
    const alertCount = await this.prisma.alert.count({
      where: { createdAt: { gte: from, lte: to } },
    });
    return { records, total, auditCount, alertCount };
  }
}
