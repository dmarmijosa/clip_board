import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { ClipboardFormat } from '../clipboard.entity';

export class CreateClipboardDto {
  @ApiProperty({
    description: 'Contenido a compartir en formato Markdown o texto plano',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ['markdown', 'text'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['markdown', 'text'])
  format?: ClipboardFormat;

  @ApiProperty({
    required: false,
    maxLength: 120,
    description: 'Etiqueta descriptiva del origen del contenido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;
}
