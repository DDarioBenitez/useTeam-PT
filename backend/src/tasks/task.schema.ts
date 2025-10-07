import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Task {
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, index: true })
  index: number;

  @Prop({ required: true })
  columnId: string;

  @Prop()
  description?: string;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
