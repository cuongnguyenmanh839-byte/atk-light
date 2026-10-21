import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SystemModule } from './system/system.module';
import { AreasModule } from './areas/areas.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AlertsModule } from './alerts/alerts.module';
import { EnergyModule } from './energy/energy.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { WebSocketModule } from './websocket/websocket.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    SystemModule,
    AreasModule,
    SchedulesModule,
    AlertsModule,
    EnergyModule,
    AuditLogsModule,
    WebSocketModule,
  ],
  providers: [
    // Apply JWT guard globally; mark public routes with @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
