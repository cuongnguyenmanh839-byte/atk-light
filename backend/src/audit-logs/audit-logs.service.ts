import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : undefined,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : undefined,
        ipAddress,
        userAgent,
      },
    });
  }

  async findAll(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { fullName: true, username: true, role: true } } },
    });
  }
}
