import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { UsersService } from '../users/users.service';
import { Role } from '../users/roles.enum';

interface JwtPayload {
  sub: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
})
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (!token || typeof token !== 'string') {
          return next(new Error('Token no proporcionado'));
        }

        const payload = await this.jwtService.verifyAsync<JwtPayload>(
          token,
        );

        if (!payload.sub) {
          return next(new Error('Token inválido'));
        }

        const user = await this.usersService.findById(payload.sub);

        if (!user || !user.isActive) {
          return next(new Error('Usuario inexistente o desactivado'));
        }

        const rolesPermitidos = [
          Role.ADMIN,
          Role.RECEPCIONISTA,
        ];

        if (!rolesPermitidos.includes(user.role)) {
          return next(new Error('No tenés permisos para acceder al mapa'));
        }

        socket.data.user = {
          userId: user.id,
          role: user.role,
        };

        next();
      } catch {
        next(new Error('Token inválido o vencido'));
      }
    });
  }

  emitBedUpdate(event: string, bed: unknown) {
    this.server.emit(event, bed);
  }
}
