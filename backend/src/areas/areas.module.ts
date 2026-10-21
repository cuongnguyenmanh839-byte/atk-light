import { Module } from '@nestjs/common';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AuditLogsModule, WebSocketModule],
  providers: [AreasService],
  controllers: [AreasController],
  exports: [AreasService],
})
export class AreasModule {}
