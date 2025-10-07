import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Column {
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, index: true })
  index: number;

  @Prop({ required: true })
  color: string;
}

export type ColumnDocument = HydratedDocument<Column>;
export const ColumnSchema = SchemaFactory.createForClass(Column);
