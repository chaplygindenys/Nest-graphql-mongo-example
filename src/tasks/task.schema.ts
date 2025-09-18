import { Document, Schema } from 'mongoose';

export interface TaskDocument extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = new Schema<TaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);
