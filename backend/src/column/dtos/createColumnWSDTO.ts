import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateColumnWSDTO {
  @IsString()
  _id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  index?: number;

  @IsString()
  color: string;

  @IsString()
  @IsOptional()
  opId?: string;

  @IsNumber()
  @IsOptional()
  clientTs?: number;
}
