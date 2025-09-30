/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type {
  ClipboardDayClearedEvent,
  ClipboardItemDto,
  ClipboardRemovedEvent,
} from './clipboard.types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class ClipboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ClipboardGateway.name);

  @WebSocketServer()
  private server?: Server;

  handleConnection(client: Socket): void {
    this.logger.verbose(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.verbose(`Client disconnected: ${client.id}`);
  }

  broadcastNewEntry(entry: ClipboardItemDto): void {
    this.server?.emit('clipboard:new', entry);
  }

  @OnEvent('clipboard.created')
  handleClipboardCreated(entry: ClipboardItemDto): void {
    this.broadcastNewEntry(entry);
  }

  broadcastUpdatedEntry(entry: ClipboardItemDto): void {
    this.server?.emit('clipboard:updated', entry);
  }

  @OnEvent('clipboard.updated')
  handleClipboardUpdated(entry: ClipboardItemDto): void {
    this.broadcastUpdatedEntry(entry);
  }

  broadcastRemovedEntry(payload: ClipboardRemovedEvent): void {
    this.server?.emit('clipboard:deleted', payload);
  }

  @OnEvent('clipboard.deleted')
  handleClipboardDeleted(payload: ClipboardRemovedEvent): void {
    this.broadcastRemovedEntry(payload);
  }

  broadcastClearedDay(payload: ClipboardDayClearedEvent): void {
    this.server?.emit('clipboard:cleared', payload);
  }

  @OnEvent('clipboard.cleared')
  handleClipboardCleared(payload: ClipboardDayClearedEvent): void {
    this.broadcastClearedDay(payload);
  }
}
