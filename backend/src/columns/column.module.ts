import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Column, ColumnSchema } from './column.schema';
import { Task, TaskSchema } from 'src/tasks/task.schema';
import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';
import { WSModule } from 'src/ws/ws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Column.name, schema: ColumnSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    WSModule,
  ],
  controllers: [ColumnController],
  providers: [ColumnService],
})
export class ColumnModule {}
