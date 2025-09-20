import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// task.schema.ts (Nest Mongoose)
@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: true,
    currentTime: () => Date.now(),
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: true, // built-in `id` virtual on
})
export class TaskModel {
  @Prop({ required: true }) title!: string;
  @Prop({ default: false }) completed!: boolean;

  // store as numbers (ms)
  @Prop({ type: Number }) createdAt!: number;
  @Prop({ type: Number }) updatedAt!: number;
}
export type TaskDocument = HydratedDocument<TaskModel>;
export const TaskSchema = SchemaFactory.createForClass(TaskModel);
