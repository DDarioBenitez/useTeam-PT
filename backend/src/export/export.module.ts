import { Module } from '@nestjs/common';
import { ExportsController } from './export.controller';
import { ExportsService } from './export.service';
import { ConfigModule } from '@nestjs/config';
import { WSModule } from 'src/ws/ws.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WSModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
