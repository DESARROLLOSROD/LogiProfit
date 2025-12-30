import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'https://logiprofit-production.up.railway.app',
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private userSockets = new Map<number, Set<string>>(); // empresaId -> Set of socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Limpiar de userSockets
    this.userSockets.forEach((socketIds, empresaId) => {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userSockets.delete(empresaId);
      }
    });
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, empresaId: number) {
    if (!this.userSockets.has(empresaId)) {
      this.userSockets.set(empresaId, new Set());
    }
    this.userSockets.get(empresaId)?.add(client.id);
    client.join(`empresa-${empresaId}`);
    this.logger.log(`Client ${client.id} joined empresa ${empresaId}`);
  }

  // Notificar flete urgente
  notifyFleteUrgente(empresaId: number, data: {
    fleteId: number;
    folio: string;
    fechaInicio: string;
    origen: string;
    destino: string;
    horasRestantes: number;
  }) {
    this.server.to(`empresa-${empresaId}`).emit('flete-urgente', data);
    this.logger.log(`Flete urgente notificado a empresa ${empresaId}: ${data.folio}`);
  }

  // Notificar flete con pérdida
  notifyFletePerdida(empresaId: number, data: {
    fleteId: number;
    folio: string;
    utilidad: number;
    margen: number;
  }) {
    this.server.to(`empresa-${empresaId}`).emit('flete-perdida', data);
    this.logger.log(`Flete con pérdida notificado a empresa ${empresaId}: ${data.folio}`);
  }

  // Notificar cotización aprobada
  notifyCotizacionAprobada(empresaId: number, data: {
    cotizacionId: number;
    folio: string;
    cliente: string;
    precio: number;
  }) {
    this.server.to(`empresa-${empresaId}`).emit('cotizacion-aprobada', data);
    this.logger.log(`Cotización aprobada notificada a empresa ${empresaId}: ${data.folio}`);
  }

  // Notificar margen bajo
  notifyMargenBajo(empresaId: number, data: {
    id: number;
    folio: string;
    tipo: 'cotizacion' | 'flete';
    margen: number;
  }) {
    this.server.to(`empresa-${empresaId}`).emit('margen-bajo', data);
    this.logger.log(`Margen bajo notificado a empresa ${empresaId}: ${data.folio}`);
  }

  // Notificación genérica
  sendNotification(empresaId: number, type: string, data: any) {
    this.server.to(`empresa-${empresaId}`).emit(type, data);
    this.logger.log(`Notificación enviada a empresa ${empresaId}: ${type}`);
  }
}
