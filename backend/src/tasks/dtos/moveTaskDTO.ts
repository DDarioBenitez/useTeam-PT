import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveTaskDTO {
  @IsString()
  taskId: string;

  @IsString()
  columnId: string;

  @IsNumber()
  toIndex: number;

  @IsString()
  toColumnId: string;

  @IsString()
  @IsOptional()
  opId: string;

  @IsNumber()
  @IsOptional()
  clientTs: number;
}
