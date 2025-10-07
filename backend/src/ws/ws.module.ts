import { Module } from '@nestjs/common';
import { WSGateway } from './ws.gateway';

@Module({
  providers: [WSGateway],
  imports: [],
  exports: [WSGateway],
})
export class WSModule {}
