import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClipboardEntry } from './clipboard.entity';
import { CreateClipboardDto } from './dto/create-clipboard.dto';
import { UpdateClipboardDto } from './dto/update-clipboard.dto';
import {
  ClipboardDaySummary,
  ClipboardItemDto,
  ClipboardDayClearedEvent,
  ClipboardRemovedEvent,
  toClipboardItemDto,
} from './clipboard.types';

const MAX_DAY_HISTORY = 30;

const isoDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const normalizeDayKeyInput = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.valueOf())) {
    return isoDayKey(parsed);
  }

  // Assume the value already follows the YYYY-MM-DD pattern
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
};

@Injectable()
export class ClipboardService {
  private readonly logger = new Logger(ClipboardService.name);

  constructor(
    @InjectRepository(ClipboardEntry)
    private readonly repository: Repository<ClipboardEntry>,
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreateClipboardDto): Promise<ClipboardItemDto> {
    const now = new Date();
    const entity = this.repository.create({
      content: dto.content,
      format: dto.format ?? 'markdown',
      source: dto.source?.trim() || null,
      dayKey: isoDayKey(now),
    });

    const saved = await this.repository.save(entity);
    const payload = toClipboardItemDto(saved);
    this.logger.verbose(`Clipboard entry saved ${payload.id}`);
    this.events.emit('clipboard.created', payload);
    return payload;
  }

  async update(id: string, dto: UpdateClipboardDto): Promise<ClipboardItemDto> {
    const entry = await this.repository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Clipboard entry ${id} not found`);
    }

    if (dto.content !== undefined) {
      entry.content = dto.content;
    }
    if (dto.format !== undefined) {
      entry.format = dto.format;
    }
    if (dto.source !== undefined) {
      const trimmed = dto.source?.trim() ?? '';
      entry.source = trimmed ? trimmed : null;
    }

    const saved = await this.repository.save(entry);
    const payload = toClipboardItemDto(saved);
    this.logger.verbose(`Clipboard entry updated ${payload.id}`);
    this.events.emit('clipboard.updated', payload);
    return payload;
  }

  async listByDay(dayKey?: string): Promise<ClipboardItemDto[]> {
    const normalizedDayKey =
      normalizeDayKeyInput(dayKey) ?? isoDayKey(new Date());
    this.logger.verbose(`Listing entries for day ${normalizedDayKey}`);
    const entries = await this.repository.find({
      where: { dayKey: normalizedDayKey },
      order: { createdAt: 'DESC' },
    });
    return entries.map(toClipboardItemDto);
  }

  async listLatestDays(
    limit = MAX_DAY_HISTORY,
  ): Promise<ClipboardDaySummary[]> {
    const qb = this.repository
      .createQueryBuilder('entry')
      .select('entry.dayKey', 'dayKey')
      .addSelect('COUNT(entry.id)', 'total')
      .groupBy('entry.dayKey')
      .orderBy('entry.dayKey', 'DESC')
      .limit(limit);

    const rows = await qb.getRawMany<{
      dayKey: Date | string;
      total: string;
    }>();
    return rows.map((row) => {
      const normalized =
        row.dayKey instanceof Date
          ? isoDayKey(row.dayKey)
          : (normalizeDayKeyInput(row.dayKey) ??
            isoDayKey(new Date(row.dayKey)));

      return {
        dayKey: normalized,
        total: Number(row.total),
      };
    });
  }

  async latest(limit = 20): Promise<ClipboardItemDto[]> {
    const entries = await this.repository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entries.map(toClipboardItemDto);
  }

  async remove(id: string): Promise<ClipboardRemovedEvent> {
    const entry = await this.repository.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Clipboard entry ${id} not found`);
    }

    const entryId = entry.id;
    const entryDay = entry.dayKey;
    await this.repository.remove(entry);
    const payload: ClipboardRemovedEvent = {
      id: entryId,
      dayKey: entryDay,
    };
    this.logger.verbose(`Clipboard entry removed ${payload.id}`);
    this.events.emit('clipboard.deleted', payload);
    return payload;
  }

  async removeByDay(dayKey?: string): Promise<ClipboardDayClearedEvent> {
    const normalized = normalizeDayKeyInput(dayKey);
    if (!normalized) {
      throw new BadRequestException('A valid day parameter is required');
    }

    const entries = await this.repository.find({
      where: { dayKey: normalized },
    });

    if (!entries.length) {
      return { dayKey: normalized, removed: 0 };
    }

    await this.repository.remove(entries);
    const payload: ClipboardDayClearedEvent = {
      dayKey: normalized,
      removed: entries.length,
    };
    this.logger.verbose(
      `Clipboard entries removed for day ${normalized}: ${entries.length}`,
    );
    this.events.emit('clipboard.cleared', payload);
    return payload;
  }
}
