import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDTO } from './dtos/createTaskDTO';
import { MoveTaskDTO } from './dtos/moveTaskDTO';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('column/:columnId')
  getTasksByColumn(@Param('columnId') columnId: string) {
    return this.taskService.listByColumn(columnId);
  }

  @Get('all')
  getAllTasks() {
    return this.taskService.listAll();
  }

  @Post()
  createTask(@Body() dto: CreateTaskDTO) {
    return this.taskService.create(dto);
  }

  @Patch('move')
  moveTask(@Body() dto: MoveTaskDTO) {
    return this.taskService.move(dto);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
