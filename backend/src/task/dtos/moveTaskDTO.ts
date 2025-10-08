import { IsInt, IsMongoId, IsOptional } from 'class-validator';

export class MoveTaskDTO {
  @IsMongoId()
  taskId: string;

  @IsMongoId()
  toColumnId: string;

  @IsInt()
  toIndex: number;

  @IsOptional()
  opId?: string;

  @IsOptional()
  clientTs?: number;
}
