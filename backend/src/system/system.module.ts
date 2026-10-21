import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AuditLogsModule, WebSocketModule],
  providers: [SystemService],
  controllers: [SystemController],
  exports: [SystemService],
})
export class SystemModule {}
