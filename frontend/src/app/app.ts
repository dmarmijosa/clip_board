import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { format, formatRelative, parseISO } from 'date-fns';
import { ClipboardApiService } from './services/clipboard-api.service';
import { ClipboardRealtimeService } from './services/clipboard-realtime.service';
import { MarkdownService } from './services/markdown.service';
import {
  ClipboardDaySummary,
  ClipboardItem,
  ClipboardRealtimeEvent,
  ClipboardRemoval,
  ClipboardDayClear,
  UpdateClipboardPayload,
} from './models/clipboard';

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  host: {
    class:
      'block min-h-screen w-full bg-transparent font-sans text-slate-100',
  },
})
export class App implements OnInit {
  private readonly api = inject(ClipboardApiService);
  private readonly realtime = inject(ClipboardRealtimeService);
  private readonly markdown = inject(MarkdownService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedDay = signal(dayKey(new Date()));
  readonly days = signal<ClipboardDaySummary[]>([]);
  readonly entries = signal<ClipboardItem[]>([]);
  readonly draft = signal('');
  readonly sourceLabel = signal(this.inferSourceLabel());
  readonly isSaving = signal(false);
  readonly copiedEntryId = signal<string | null>(null);
  readonly editingEntryId = signal<string | null>(null);
  readonly editDraft = signal('');
  readonly editSource = signal('');
  readonly editSaving = signal(false);
  readonly deletingEntryId = signal<string | null>(null);
  readonly bulkDeleting = signal(false);
  readonly daysLoading = signal(false);
  readonly entriesLoading = signal(false);

  readonly realtimeConnected = this.realtime.status();

  readonly previewHtml = computed(() => this.markdown.toHtml(this.draft()));
  readonly totalEntries = computed(() => this.entries().length);
  readonly canSubmit = computed(
    () => !!this.draft().trim() && !this.isSaving(),
  );

  private copyResetHandle: number | null = null;

  ngOnInit(): void {
    void this.initialize();

    this.realtime
      .connect()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.handleRealtimeEvent(event);
      });

    this.destroyRef.onDestroy(() => {
      if (this.copyResetHandle) {
        window.clearTimeout(this.copyResetHandle);
      }
    });
  }

  async refreshDays(): Promise<void> {
    await this.loadDays();
    await this.loadEntries();
  }

  async submit(): Promise<void> {
    const content = this.draft().trim();
    if (!content || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    try {
      const entry = await firstValueFrom(
        this.api.create({
          content,
          format: 'markdown',
          source: this.sourceLabel().trim() || undefined,
        }),
      );
      this.draft.set('');
      this.handleRealtimeEvent({ type: 'created', payload: entry });
      await this.copyToClipboard(entry.content, entry.id);
    } finally {
      this.isSaving.set(false);
    }
  }

  async copyEntry(entry: ClipboardItem): Promise<void> {
    await this.copyToClipboard(entry.content, entry.id);
  }

  beginEdit(entry: ClipboardItem): void {
    this.editingEntryId.set(entry.id);
    this.editDraft.set(entry.content);
    this.editSource.set(entry.source ?? '');
  }

  cancelEdit(): void {
    this.resetEditState();
  }

  async saveEdit(): Promise<void> {
    const entryId = this.editingEntryId();
    if (!entryId || this.editSaving()) {
      return;
    }

    const content = this.editDraft().trim();
    if (!content) {
      return;
    }

    this.editSaving.set(true);
    try {
      const sourceValue = this.editSource().trim();
      const payload: UpdateClipboardPayload = {
        content,
        source: sourceValue ? sourceValue : null,
      };
      const updated = await firstValueFrom(this.api.update(entryId, payload));
      this.resetEditState();
      this.handleRealtimeEvent({ type: 'updated', payload: updated });
    } finally {
      this.editSaving.set(false);
    }
  }

  async deleteEntry(entry: ClipboardItem): Promise<void> {
    if (this.deletingEntryId()) {
      return;
    }

    const confirmed = window.confirm(
      '¿Deseas eliminar este elemento del clipboard?',
    );
    if (!confirmed) {
      return;
    }

    this.deletingEntryId.set(entry.id);
    try {
      const result = await firstValueFrom(this.api.delete(entry.id));
      this.handleRealtimeEvent({ type: 'deleted', payload: result });
    } finally {
      this.deletingEntryId.set(null);
    }
  }

  async clearSelectedDay(): Promise<void> {
    const day = this.selectedDay();
    if (!day || this.bulkDeleting()) {
      return;
    }

    const confirmed = window.confirm(
      '¿Quieres eliminar todas las entradas de este día?',
    );
    if (!confirmed) {
      return;
    }

    this.bulkDeleting.set(true);
    try {
      const result = await firstValueFrom(this.api.deleteByDay(day));
      this.handleRealtimeEvent({ type: 'cleared', payload: result });
    } finally {
      this.bulkDeleting.set(false);
    }
  }

  formatDayLabel(day: string): string {
    return format(parseISO(`${day}T00:00:00Z`), 'PPP');
  }

  formatTimestamp(entry: ClipboardItem): string {
    return formatRelative(parseISO(entry.createdAt), new Date());
  }

  markdownContent(entry: ClipboardItem): string {
    return this.markdown.toHtml(entry.content);
  }

  selectDay(day: string): void {
    if (this.selectedDay() !== day) {
      this.selectedDay.set(day);
      this.resetEditState();
      void this.loadEntries(day);
    }
  }

  trackByEntry(_index: number, item: ClipboardItem) {
    return item.id;
  }

  trackByDay(_index: number, item: ClipboardDaySummary) {
    return item.dayKey;
  }

  private inferSourceLabel(): string {
    const platform = navigator.platform || 'web';
    const language = navigator.language || 'en';
    return `${platform} • ${language}`;
  }

  private async initialize(): Promise<void> {
    await this.loadDays();
    await this.loadEntries();
  }

  private async loadDays(): Promise<void> {
    this.daysLoading.set(true);
    try {
      const list = await firstValueFrom(this.api.listDays());
      this.days.set(list);
      const current = this.selectedDay();
      if (list.length && !list.some((day) => day.dayKey === current)) {
        const fallback = list[0]!.dayKey;
        this.selectedDay.set(fallback);
        await this.loadEntries(fallback);
        return;
      }
      if (!list.length) {
        this.entries.set([]);
        this.resetEditState();
      }
    } catch (error) {
      console.error('Error al cargar los días del clipboard', error);
    } finally {
      this.daysLoading.set(false);
    }
  }

  private async loadEntries(dayKey = this.selectedDay()): Promise<void> {
    this.entriesLoading.set(true);
    try {
      const items = await firstValueFrom(this.api.listByDay(dayKey));
      this.entries.set(items);
    } catch (error) {
      console.error('Error al cargar las entradas del clipboard', error);
      this.entries.set([]);
    } finally {
      this.resetEditState();
      this.entriesLoading.set(false);
    }
  }

  private handleRealtimeEvent(event: ClipboardRealtimeEvent): void {
    switch (event.type) {
      case 'created':
        this.applyRealtimeCreated(event.payload);
        break;
      case 'updated':
        this.applyRealtimeUpdated(event.payload);
        break;
      case 'deleted':
        this.applyRealtimeDeleted(event.payload);
        break;
      case 'cleared':
        this.applyRealtimeCleared(event.payload);
        break;
    }
  }

  private applyRealtimeCreated(entry: ClipboardItem): void {
    let inserted = false;
    this.entries.update((items) => {
      if (entry.dayKey !== this.selectedDay()) {
        return items;
      }
      if (items.some((item) => item.id === entry.id)) {
        return items;
      }
      inserted = true;
      return [entry, ...items];
    });

    if (inserted || entry.dayKey !== this.selectedDay()) {
      void this.loadDays();
    }
  }

  private applyRealtimeUpdated(entry: ClipboardItem): void {
    let affected = false;
    this.entries.update((items) => {
      const selected = this.selectedDay();
      if (entry.dayKey !== selected) {
        if (items.some((item) => item.id === entry.id)) {
          affected = true;
          return items.filter((item) => item.id !== entry.id);
        }
        return items;
      }

      let replaced = false;
      const next = items.map((item) => {
        if (item.id === entry.id) {
          replaced = true;
          affected = true;
          return entry;
        }
        return item;
      });

      if (replaced) {
        return next;
      }

      affected = true;
      return [entry, ...items];
    });

    if (affected && this.editingEntryId() === entry.id) {
      this.editDraft.set(entry.content);
      this.editSource.set(entry.source ?? '');
    }
  }

  private applyRealtimeDeleted(payload: ClipboardRemoval): void {
    let removed = false;
    this.entries.update((items) => {
      if (payload.dayKey !== this.selectedDay()) {
        return items;
      }
      const filtered = items.filter((item) => item.id !== payload.id);
      removed = filtered.length !== items.length;
      return filtered;
    });

    if (this.editingEntryId() === payload.id) {
      this.resetEditState();
    }

    if (removed || payload.dayKey !== this.selectedDay()) {
      void this.loadDays();
    }
  }

  private applyRealtimeCleared(payload: ClipboardDayClear): void {
    if (payload.dayKey === this.selectedDay()) {
      this.entries.set([]);
      this.resetEditState();
    }
    void this.loadDays();
  }

  private resetEditState(): void {
    this.editingEntryId.set(null);
    this.editDraft.set('');
    this.editSource.set('');
  }

  private async copyToClipboard(content: string, entryId: string): Promise<void> {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      this.copiedEntryId.set(entryId);
      if (this.copyResetHandle) {
        window.clearTimeout(this.copyResetHandle);
      }
      this.copyResetHandle = window.setTimeout(() => {
        this.copiedEntryId.set(null);
      }, 2000);
    }
  }
}
