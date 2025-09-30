import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verifica el estado del servicio' })
  @ApiOkResponse({ description: 'Estado operativo de la API' })
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }
}
