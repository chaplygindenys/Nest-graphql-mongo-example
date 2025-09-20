import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

// task.schema.ts (Nest Mongoose)
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskModel {
  @Prop({required:true}) title!: string;
  @Prop({ default: false }) completed!: boolean;
}

export type TaskDocument = HydratedDocument<TaskModel>;
export const TaskSchema = SchemaFactory.createForClass(TaskModel);

TaskSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
