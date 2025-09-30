import { PartialType } from '@nestjs/swagger';
import { CreateClipboardDto } from './create-clipboard.dto';

export class UpdateClipboardDto extends PartialType(CreateClipboardDto) {}
