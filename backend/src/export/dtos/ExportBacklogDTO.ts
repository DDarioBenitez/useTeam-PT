import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';

const ALLOWED_FIELDS = [
  '_id',
  'title',
  'description',
  'column',
  'createdAt',
] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export class ExportBacklogDTO {
  @IsEmail()
  email: string;

  // opcional: campos a exportar en el CSV
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALLOWED_FIELDS, { each: true })
  fields?: AllowedField[];

  // opcional: si ya sabés el ID de la columna (ObjectId de Mongo)
  @IsOptional()
  @IsMongoId()
  columnId?: string;

  // opcional: nombre de la columna (si no pasás columnId)
  // default: "Backlog"
  @IsOptional()
  @IsString()
  columnName?: string;
}
