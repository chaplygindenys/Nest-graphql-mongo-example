// src/tasks/tasks.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { Model, isValidObjectId } from 'mongoose';
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

  async findAll(): Promise<TaskDTO[]> {
    const docs = await this.taskModel.find().sort({ createdAt: -1 });

    console.log('virtuals', docs);

    return (docs as TaskLean[]).map(toTaskDTO);
  }

  async findOne(id: string): Promise<TaskDTO> {
    const doc = await this.taskModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    return toTaskDTO(doc as TaskLean);
  }

  async create(input: CreateTaskInput): Promise<TaskDTO> {
    const created = await this.taskModel.create(input);
    const obj = created.toObject({ virtuals: true, getters: true }) as TaskLean;

    console.log('created', created);
    const dto = toTaskDTO(obj);
    await this.pubSub.publish('taskAdded', { taskAdded: dto });
    return dto;
  }

  async update(input: UpdateTaskInput): Promise<TaskDTO> {
    const doc = await this.taskModel
      .findByIdAndUpdate(input.id, input, { new: true })
      .exec();
    console.log('updated', doc);

    if (!doc) throw new NotFoundException('Task not found');
    const dto = toTaskDTO(doc as TaskLean);
    await this.pubSub.publish('taskUpdated', { taskUpdated: dto });
    return dto;
  }

  async remove(id: string): Promise<TaskDTO> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid task id');
    }
    const doc = await this.taskModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    const dto = toTaskDTO(doc as TaskLean);
    await this.pubSub.publish('taskDeleted', { taskDeleted: dto });
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
