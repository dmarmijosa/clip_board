import { Injectable, OnDestroy, signal } from '@angular/core';
import { fromEvent, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  ClipboardDayClear,
  ClipboardItem,
  ClipboardRealtimeEvent,
  ClipboardRemoval,
} from '../models/clipboard';

@Injectable({ providedIn: 'root' })
export class ClipboardRealtimeService implements OnDestroy {
  private socket?: Socket;
  private readonly isConnected = signal(false);

  connect(): Observable<ClipboardRealtimeEvent> {
    if (!this.socket) {
      this.socket = io(environment.wsBaseUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });
      this.socket.on('connect', () => this.isConnected.set(true));
      this.socket.on('disconnect', () => this.isConnected.set(false));
    }

    const created$ = fromEvent<ClipboardItem>(
      this.socket,
      'clipboard:new',
    ).pipe(map((payload) => ({ type: 'created', payload }) as const));

    const updated$ = fromEvent<ClipboardItem>(
      this.socket,
      'clipboard:updated',
    ).pipe(map((payload) => ({ type: 'updated', payload }) as const));

    const deleted$ = fromEvent<ClipboardRemoval>(
      this.socket,
      'clipboard:deleted',
    ).pipe(map((payload) => ({ type: 'deleted', payload }) as const));

    const cleared$ = fromEvent<ClipboardDayClear>(
      this.socket,
      'clipboard:cleared',
    ).pipe(map((payload) => ({ type: 'cleared', payload }) as const));

    return merge(created$, updated$, deleted$, cleared$);
  }

  status() {
    return this.isConnected.asReadonly();
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }
}
