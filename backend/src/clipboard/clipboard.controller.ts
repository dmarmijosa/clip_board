import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClipboardService } from './clipboard.service';
import { CreateClipboardDto } from './dto/create-clipboard.dto';
import {
  ClipboardDayClearedEvent,
  ClipboardDaySummary,
  ClipboardItemDto,
  ClipboardRemovedEvent,
} from './clipboard.types';
import { UpdateClipboardDto } from './dto/update-clipboard.dto';

@ApiTags('clipboard')
@Controller('clipboard')
export class ClipboardController {
  constructor(private readonly service: ClipboardService) {}

  @ApiOperation({
    summary: 'Obtiene las entradas del clipboard para un día específico',
  })
  @ApiOkResponse({ type: ClipboardItemDto, isArray: true })
  @ApiQuery({ name: 'day', required: false })
  @Get()
  listByDay(@Query('day') day?: string) {
    return this.service.listByDay(day);
  }

  @ApiOperation({
    summary: 'Lista los días disponibles ordenados de forma descendente',
  })
  @ApiOkResponse({ type: ClipboardDaySummary, isArray: true })
  @Get('days')
  listDays() {
    return this.service.listLatestDays();
  }

  @ApiOperation({
    summary: 'Recupera las últimas entradas del clipboard sin agrupar por día',
  })
  @ApiOkResponse({ type: ClipboardItemDto, isArray: true })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @Get('latest')
  latest(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return this.service.latest(Number.isFinite(parsed) ? parsed : undefined);
  }

  @ApiOperation({ summary: 'Crea una nueva entrada en el clipboard' })
  @ApiCreatedResponse({ type: ClipboardItemDto })
  @Post()
  create(@Body() dto: CreateClipboardDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Actualiza una entrada existente' })
  @ApiOkResponse({ type: ClipboardItemDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClipboardDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Elimina una entrada específica' })
  @ApiOkResponse({ type: ClipboardRemovedEvent })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @ApiOperation({ summary: 'Elimina todas las entradas de un día dado' })
  @ApiOkResponse({ type: ClipboardDayClearedEvent })
  @ApiQuery({ name: 'day', required: true })
  @Delete()
  @HttpCode(200)
  removeByDay(@Query('day') day: string) {
    return this.service.removeByDay(day);
  }
}
