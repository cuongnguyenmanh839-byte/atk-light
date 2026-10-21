import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { SystemModule } from '../system/system.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [SystemModule, WebSocketModule],
  providers: [SchedulesService],
  controllers: [SchedulesController],
  exports: [SchedulesService],
})
export class SchedulesModule {}
