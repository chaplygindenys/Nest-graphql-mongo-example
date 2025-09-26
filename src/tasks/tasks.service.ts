// src/tasks/tasks.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateTaskInput } from './dto/create-task.input';
import { TaskDTO } from './dto/task.dto';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskLean, toTaskDTO } from './mappers';
import { TaskDocument, TaskModel } from './task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(TaskModel.name) // <-- same name here
    private readonly taskModel: Model<TaskDocument>,

    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  async findAllByUser(userId: string) {
    return this.taskModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec()
      .then((docs) => docs.map((d) => d.toObject({ virtuals: true })));
  }

  async findOne(id: string): Promise<TaskDTO> {
    const doc = await this.taskModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    return toTaskDTO(doc as TaskLean);
  }

  async create(input: CreateTaskInput, userId: string): Promise<TaskDTO> {
    const created = await this.taskModel.create({ ...input, userId });
    const obj = created.toObject({ virtuals: true, getters: true }) as TaskLean;

    console.log('created', created, userId);
    const dto = toTaskDTO(obj);
    await this.pubSub.publish('taskAdded', { taskAdded: dto, userId });
    return dto;
  }

  async update(input: UpdateTaskInput, userId: string): Promise<TaskDTO> {
    console.log('update input ', input, ' by user ', userId);

    const doc = await this.taskModel
      .findOneAndUpdate(
        { _id: input.id, userId: new Types.ObjectId(userId) },
        input,
        { new: true },
      )
      .exec();
    console.log('updated', doc);

    if (!doc) throw new NotFoundException('Task not found');
    const dto = toTaskDTO(doc as TaskLean);
    await this.pubSub.publish('taskUpdated', { taskUpdated: dto, userId });
    return dto;
  }

  async remove(id: string, userId: string): Promise<TaskDTO> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid task id');
    }
    const doc = await this.taskModel
      .findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!doc) throw new NotFoundException('Task not found');
    const dto = toTaskDTO(doc as TaskLean);
    await this.pubSub.publish('taskDeleted', { taskDeleted: dto, userId });
    return dto;
  }

  async toggle(id: string): Promise<TaskDTO> {
    const doc = await this.taskModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    doc.completed = !doc.completed;
    await doc.save();
    const obj = doc.toObject({ virtuals: true }) as TaskLean;
    console.log('toggle', obj);

    const dto = toTaskDTO(obj);
    await this.pubSub.publish('taskUpdated', { taskUpdated: dto });
    return dto;
  }
}
