import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveColumnDTO {
  @IsString()
  columnId: string;

  @IsNumber()
  toIndex: number;

  @IsString()
  @IsOptional()
  opId: string;

  @IsNumber()
  @IsOptional()
  clientTs: number;
}
