import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  const token = localStorage.getItem('atk-access-token');
  const wsUrl = BASE_URL.replace('/api', '');

  if (!socket) {
    socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  } else {
    // Update token if changed
    if (socket.auth && typeof socket.auth === 'object') {
      (socket.auth as any).token = token;
    }
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function reconnectSocketWithToken() {
  if (socket) {
    const token = localStorage.getItem('atk-access-token');
    (socket.auth as any) = { token };
    socket.disconnect().connect();
  } else {
    getSocket();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
