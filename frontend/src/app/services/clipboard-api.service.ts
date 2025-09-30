import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  ClipboardDayClear,
  ClipboardDaySummary,
  ClipboardItem,
  ClipboardRemoval,
  CreateClipboardPayload,
  UpdateClipboardPayload,
} from '../models/clipboard';

@Injectable({ providedIn: 'root' })
export class ClipboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listDays() {
    return this.http.get<ClipboardDaySummary[]>(`${this.baseUrl}/clipboard/days`);
  }

  listByDay(dayKey?: string) {
    const params = dayKey ? { day: dayKey } : undefined;
    return this.http.get<ClipboardItem[]>(`${this.baseUrl}/clipboard`, { params });
  }

  latest(limit = 20) {
    const params = { limit: String(limit) };
    return this.http.get<ClipboardItem[]>(`${this.baseUrl}/clipboard/latest`, { params });
  }

  create(payload: CreateClipboardPayload) {
    return this.http.post<ClipboardItem>(`${this.baseUrl}/clipboard`, payload);
  }

  update(id: string, payload: UpdateClipboardPayload) {
    return this.http.patch<ClipboardItem>(`${this.baseUrl}/clipboard/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ClipboardRemoval>(`${this.baseUrl}/clipboard/${id}`);
  }

  deleteByDay(dayKey: string) {
    const params = { day: dayKey };
    return this.http.delete<ClipboardDayClear>(`${this.baseUrl}/clipboard`, { params });
  }
}
