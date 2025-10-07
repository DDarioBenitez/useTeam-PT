import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateColumnDTO {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  index?: number;

  @IsString()
  color: string;
}
