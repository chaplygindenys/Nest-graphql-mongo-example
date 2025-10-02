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
  ) {
    // Attach debug listeners for all triggers you use
    for (const trigger of ['taskAdded', 'taskUpdated', 'taskDeleted']) {
      // note: PubSub.subscribe exists in graphql-subscriptions and returns a sub id
      this.pubSub
        .subscribe(trigger, (payload) => {
          console.log(`[PUBSUB → emit] ${trigger}:`, JSON.stringify(payload));
        })
        .then((id) => {
          console.log(`[PUBSUB] listener #${id} attached for ${trigger}`);
        })
        .catch(console.error);
    }
  }

  async findAllByUser(userId: string) {
    const tasks = await this.taskModel
      .find({
        userId: userId,
      })
      .sort({ createdAt: -1 })
      .exec()
      .then((docs) => docs.map((d) => d.toObject({ virtuals: true })));

    return tasks;
  }

  async findOne(id: string): Promise<TaskDTO> {
    const doc = await this.taskModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Task not found');
    return toTaskDTO(doc as TaskLean);
  }

  async create(input: CreateTaskInput, userId: string): Promise<TaskDTO> {
    console.log('[service] create input:', input, 'userId:', userId);

    const created = await this.taskModel.create({ ...input, userId });
    const obj = created.toObject({ virtuals: true, getters: true }) as TaskLean;

    const dto = toTaskDTO(obj);
    await this.pubSub.publish('taskAdded', { taskAdded: dto, userId });

    return dto;
  }

  async update(input: UpdateTaskInput, userId: string): Promise<TaskDTO> {
    const doc = await this.taskModel
      .findOneAndUpdate({ _id: input.id, userId: userId }, input, { new: true })
      .exec();

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
      .findOneAndDelete({ _id: id, userId: userId })
      .exec();
    if (!doc) throw new NotFoundException('Task not found');
    const dto = toTaskDTO(doc as TaskLean);
    await this.pubSub.publish('taskDeleted', { taskDeleted: dto, userId });
    return dto;
  }
}
