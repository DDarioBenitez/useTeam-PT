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

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  tag: string;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ columnId: 1, index: 1 }, { unique: true });
