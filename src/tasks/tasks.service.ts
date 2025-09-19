import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TaskDocument } from './task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel('Task') private readonly taskModel: Model<TaskDocument>,
  ) {}

  async findAll() {
    return this.taskModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.taskModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    return doc;
  }

  async create(input: CreateTaskInput) {
    return this.taskModel.create(input);
  }

  async update(input: UpdateTaskInput) {
    const { id, ...patch } = input;
    const updated = await this.taskModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async remove(id: string): Promise<Task> {
    if (!isValidObjectId(id)) {
      console.log('Invalid id:', id);

      throw new BadRequestException('Invalid task id');
    }

    console.log("remove", { id });

    const doc = await this.taskModel.findById(id);

    const res = await this.taskModel.findByIdAndDelete(id).exec();

    if (!doc) {
      console.log('Task not found', doc, res);
      throw new NotFoundException('Task not found');
    }

    // If you use virtual id/toJSON in your schema this is fine to return directly.
    // Otherwise: return doc.toObject();
    return doc as unknown as Task;
  }
  async toggle(id: string) {
    const task = await this.findOne(id);
    task.completed = !task.completed;
    await task.save();
    return task;
  }
}
