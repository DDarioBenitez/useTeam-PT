import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ExportsService } from './export.service';
import { ExportBacklogDTO } from './dtos/ExportBacklogDTO';
import { WSGateway } from 'src/ws/ws.gateway';

@Controller('export')
export class ExportsController {
  constructor(
    private readonly serviceExport: ExportsService,
    private ws: WSGateway,
  ) {}

  @Post('backlog')
  @HttpCode(HttpStatus.ACCEPTED)
  async exportBacklog(@Body() dto: ExportBacklogDTO) {
    await this.serviceExport.triggerExportBacklog(dto);
    return {
      ok: true,
      message:
        'Export process started, you will receive an email when it is finished',
    };
  }

  @Post('notify')
  @HttpCode(HttpStatus.ACCEPTED)
  async notify() {
    this.ws.notify();
    return {
      ok: true,
      message: 'Notification sent',
    };
  }
}
