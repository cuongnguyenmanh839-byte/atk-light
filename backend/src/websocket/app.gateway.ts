import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const payload = this.jwtService.verify(token, {
            secret: this.config.get('JWT_SECRET'),
          });
          (client as any).user = payload;
        } catch {
          // invalid token, still allow guest view
        }
      }
      client.join('dashboard');
    } catch {
      client.join('dashboard');
    }
  }

  handleDisconnect(client: Socket) {
    // cleanup if needed
  }

  // ── Broadcast helpers ────────────────────────────────
  broadcastSystemUpdate(data: any) {
    this.server.to('dashboard').emit('system:updated', data);
  }

  broadcastAreaUpdate(data: any) {
    this.server.to('dashboard').emit('area:updated', data);
  }

  broadcastAlert(data: any) {
    this.server.to('dashboard').emit('alert:new', data);
  }

  broadcastEnergyUpdate(data: any) {
    this.server.to('dashboard').emit('energy:updated', data);
  }

  broadcastScheduleExecuted(data: any) {
    this.server.to('dashboard').emit('schedule:executed', data);
  }
}
