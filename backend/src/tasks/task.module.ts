import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WSModule } from 'src/ws/ws.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    WSModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
