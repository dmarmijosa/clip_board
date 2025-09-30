export interface ClipboardItem {
  id: string;
  content: string;
  format: 'markdown' | 'text';
  source?: string | null;
  dayKey: string;
  createdAt: string;
}

export interface ClipboardDaySummary {
  dayKey: string;
  total: number;
}

export interface CreateClipboardPayload {
  content: string;
  format?: 'markdown' | 'text';
  source?: string | null;
}

export interface UpdateClipboardPayload {
  content?: string;
  format?: 'markdown' | 'text';
  source?: string | null;
}

export interface ClipboardRemoval {
  id: string;
  dayKey: string;
}

export interface ClipboardDayClear {
  dayKey: string;
  removed: number;
}

export type ClipboardRealtimeEvent =
  | { type: 'created'; payload: ClipboardItem }
  | { type: 'updated'; payload: ClipboardItem }
  | { type: 'deleted'; payload: ClipboardRemoval }
  | { type: 'cleared'; payload: ClipboardDayClear };
