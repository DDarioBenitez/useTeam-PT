import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaskDTO {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  columnId: string;

  @IsOptional()
  @IsNumber()
  index?: number;
}
