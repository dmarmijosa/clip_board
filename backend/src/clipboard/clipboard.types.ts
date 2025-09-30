import { ApiProperty } from '@nestjs/swagger';
import type { ClipboardEntry } from './clipboard.entity';

export class ClipboardItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Contenido del clipboard' })
  content: string;

  @ApiProperty({ enum: ['markdown', 'text'], default: 'markdown' })
  format: ClipboardEntry['format'];

  @ApiProperty({ nullable: true, required: false, maxLength: 120 })
  source?: string | null;

  @ApiProperty({ description: 'Clave de día en formato ISO (YYYY-MM-DD)' })
  dayKey: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class ClipboardDaySummary {
  @ApiProperty({ description: 'Clave de día en formato ISO (YYYY-MM-DD)' })
  dayKey: string;

  @ApiProperty({ description: 'Total de entradas en el día' })
  total: number;
}

export class ClipboardRemovedEvent {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Clave de día en formato ISO (YYYY-MM-DD)' })
  dayKey: string;
}

export class ClipboardDayClearedEvent {
  @ApiProperty({ description: 'Clave de día en formato ISO (YYYY-MM-DD)' })
  dayKey: string;

  @ApiProperty({ description: 'Total de registros eliminados' })
  removed: number;
}

export const toClipboardItemDto = (
  entry: ClipboardEntry,
): ClipboardItemDto => ({
  id: entry.id,
  content: entry.content,
  format: entry.format,
  source: entry.source ?? null,
  dayKey: entry.dayKey,
  createdAt: entry.createdAt.toISOString(),
});
