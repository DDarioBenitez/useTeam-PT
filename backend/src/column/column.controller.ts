import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ColumnService } from './column.service';
import { CreateColumnDTO } from './dtos/createColumnDTO';
import { MoveColumnDTO } from './dtos/moveColumnDTO';

@Controller('columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Get()
  getColumns() {
    return this.columnService.list();
  }

  @Post()
  createColumn(@Body() dto: CreateColumnDTO) {
    return this.columnService.create(dto);
  }

  @Patch('move')
  moveColumn(@Body() dto: MoveColumnDTO) {
    return this.columnService.move(dto);
  }

  @Delete(':id')
  deleteColumn(@Param('id') id: string) {
    return this.columnService.remove(id);
  }
}
