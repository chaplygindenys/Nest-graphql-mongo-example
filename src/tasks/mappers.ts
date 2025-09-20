// src/tasks/mappers.ts
import { TaskDTO } from './dto/task.dto';
import { TaskDocument } from './task.schema';

// What a "lean" task looks like (with our 'id' virtual included):
export type TaskLean = TaskDocument & {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

export function toTaskDTO(obj: TaskLean): TaskDTO {
  return {
    id: obj.id,
    title: obj.title,
    completed: obj.completed ?? false,
    createdAt: obj.createdAt!,
    updatedAt: obj.updatedAt!,
  };
}
