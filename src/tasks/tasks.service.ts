import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
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

  async remove(id: string) {
    const res = await this.taskModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Task not found');
    return true;
  }

  async toggle(id: string) {
    const task = await this.findOne(id);
    task.completed = !task.completed;
    await task.save();
    return task;
  }
}
