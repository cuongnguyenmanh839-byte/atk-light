import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../websocket/app.gateway';
import { forwardToEsp32 } from '../common/esp32';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async getState() {
    const [state, areas, recentAlerts, scenes, todayEnergy] = await Promise.all([
      this.getSystemState(),
      this.prisma.area.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.lightingScene.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.getTodayEnergy(),
    ]);

    const totalLights = areas.reduce((sum, a) => sum + a.totalLights, 0);
    const activeLights = areas.reduce((sum, a) => sum + (a.power ? a.activeLights : 0), 0);

    return {
      power: state.power,
      brightness: state.brightness,
      colorTemperature: state.colorTemperature,
      mode: state.mode,
      areas: areas.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        icon: a.icon,
        mapX: a.mapX,
        mapY: a.mapY,
        power: a.power,
        brightness: a.brightness,
        colorTemperature: a.colorTemperature,
        totalLights: a.totalLights,
        activeLights: a.activeLights,
        on: a.power,
        lamps: a.totalLights,
        lit: a.power ? a.activeLights : 0,
      })),
      totalLights,
      activeLights,
      alerts: recentAlerts,
      scenes,
      energyToday: todayEnergy,
    };
  }

  async setPower(power: boolean, userId: string) {
    const state = await this.getSystemState();
    await this.prisma.systemState.update({ where: { id: 'singleton' }, data: { power } });

    // Update all areas
    await this.prisma.area.updateMany({
      data: { power, activeLights: power ? undefined : 0 },
    });
    if (!power) {
      // Set activeLights to 0 for all
      const areas = await this.prisma.area.findMany();
      for (const area of areas) {
        await this.prisma.area.update({ where: { id: area.id }, data: { activeLights: 0 } });
      }
    } else {
      // Restore activeLights = totalLights
      const areas = await this.prisma.area.findMany();
      for (const area of areas) {
        await this.prisma.area.update({ where: { id: area.id }, data: { activeLights: area.totalLights } });
      }
    }

    await this.prisma.alert.create({
      data: {
        type: power ? 'SYSTEM_POWER_ON' : 'SYSTEM_POWER_OFF',
        severity: 'INFO',
        title: power ? 'Đã bật toàn bộ hệ thống' : 'Đã tắt toàn bộ hệ thống',
        message: 'Thao tác từ trung tâm điều khiển',
      },
    });

    const newState = await this.getState();
    this.gateway.broadcastSystemUpdate(newState);

    // Dispatch to ESP32 Relay
    forwardToEsp32({ systemOn: power }).catch(() => {});

    return newState;
  }

  async setBrightness(brightness: number, userId: string) {
    await this.prisma.systemState.update({ where: { id: 'singleton' }, data: { brightness } });
    this.gateway.broadcastSystemUpdate({ brightness });
    forwardToEsp32({ brightness }).catch(() => {});
    return { brightness };
  }

  async setColorTemperature(colorTemperature: number, userId: string) {
    await this.prisma.systemState.update({ where: { id: 'singleton' }, data: { colorTemperature } });
    this.gateway.broadcastSystemUpdate({ colorTemperature });
    return { colorTemperature };
  }

  async setMode(mode: number, userId: string) {
    const scene = await this.prisma.lightingScene.findFirst({ where: { sortOrder: mode } });
    const data: any = { mode };
    if (scene) {
      data.brightness = scene.brightness;
      data.colorTemperature = scene.colorTemperature;
    }
    await this.prisma.systemState.update({ where: { id: 'singleton' }, data });

    if (scene) {
      await this.prisma.alert.create({
        data: {
          type: 'MODE_CHANGED',
          severity: 'INFO',
          title: `Chế độ ${scene.name}`,
          message: scene.description,
        },
      });
    }

    const newState = await this.getState();
    this.gateway.broadcastSystemUpdate(newState);

    // Dispatch to ESP32 Relay
    forwardToEsp32({ mode }).catch(() => {});

    return newState;
  }

  async getEnergyChart() {
    // Generate energy data for last 24 hours
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const records = await this.prisma.energyRecord.findMany({
      where: { recordedAt: { gte: dayAgo }, areaId: null, deviceId: null },
      orderBy: { recordedAt: 'asc' },
    });

    // Group by hour
    const byHour: Record<string, number> = {};
    for (let h = 0; h < 25; h++) {
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

  private async getTodayEnergy(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await this.prisma.energyRecord.aggregate({
      where: { recordedAt: { gte: today }, areaId: null, deviceId: null },
      _sum: { energy: true },
    });
    return records._sum.energy ?? 0;
  }

  private async getSystemState() {
    let state = await this.prisma.systemState.findUnique({ where: { id: 'singleton' } });
    if (!state) {
      state = await this.prisma.systemState.create({
        data: { id: 'singleton', power: true, brightness: 70, colorTemperature: 4000, mode: 0 },
      });
    }
    return state;
  }
}
