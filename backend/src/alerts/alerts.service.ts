import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit = 50, onlyUnread = false) {
    return this.prisma.alert.findMany({
      where: onlyUnread ? { acknowledged: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        area: { select: { id: true, name: true } },
        device: { select: { id: true, name: true } },
      },
    });
  }

  async acknowledge(id: string, userId: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy: userId },
    });
  }

  async acknowledgeAll(userId: string) {
    return this.prisma.alert.updateMany({
      where: { acknowledged: false },
      data: { acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy: userId },
    });
  }
}
