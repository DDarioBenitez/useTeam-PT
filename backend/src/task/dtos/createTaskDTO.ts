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

  @IsString()
  color: string;

  @IsString()
  tag: string;

  @IsString()
  @IsOptional()
  opId?: string;

  @IsNumber()
  @IsOptional()
  clientTs?: number;
}
