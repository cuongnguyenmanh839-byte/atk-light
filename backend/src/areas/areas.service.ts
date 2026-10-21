import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../websocket/app.gateway';
import { forwardToEsp32 } from '../common/esp32';

@Injectable()
export class AreasService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async findAll() {
    const areas = await this.prisma.area.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { lights: true } } },
    });
    return areas.map((a) => ({
      ...a,
      totalLights: a._count.lights,
    }));
  }

  async findOne(id: string) {
    const area = await this.prisma.area.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { lights: true },
    });
    if (!area) throw new NotFoundException('Khu vực không tồn tại');
    return area;
  }

  async setPower(id: string, power: boolean, userId: string) {
    const area = await this.prisma.area.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!area) throw new NotFoundException('Khu vực không tồn tại');

    const activeLights = power ? area.totalLights : 0;
    const updated = await this.prisma.area.update({
      where: { id: area.id },
      data: { power, activeLights },
    });

    // Update all light devices in area
    await this.prisma.lightDevice.updateMany({
      where: { areaId: area.id },
      data: { power, status: 'ONLINE' },
    });

    // Create alert
    await this.prisma.alert.create({
      data: {
        type: power ? 'AREA_POWER_ON' : 'AREA_POWER_OFF',
        severity: 'INFO',
        title: `${power ? 'Bật' : 'Tắt'} khu vực: ${area.name}`,
        message: `Khu vực ${area.name} đã được ${power ? 'bật' : 'tắt'} chiếu sáng`,
        areaId: area.id,
      },
    });

    this.gateway.broadcastAreaUpdate({ id: area.id, code: area.code, power, activeLights });

    // Dispatch to ESP32 Relay
    forwardToEsp32({ area: { id: area.code, on: power } }).catch(() => {});

    return updated;
  }

  async setBrightness(id: string, brightness: number, userId: string) {
    const area = await this.prisma.area.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!area) throw new NotFoundException('Khu vực không tồn tại');
    const updated = await this.prisma.area.update({ where: { id: area.id }, data: { brightness } });
    this.gateway.broadcastAreaUpdate({ id: area.id, code: area.code, brightness });
    return updated;
  }
}
