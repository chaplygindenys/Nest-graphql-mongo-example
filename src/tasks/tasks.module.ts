// tasks.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { TaskModel, TaskSchema } from './task.schema';
import { TasksResolver } from './tasks.resolver';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskModel.name, schema: TaskSchema }, // <-- use TaskModel.name
    ]),
  ],
  providers: [
    TasksResolver,
    TasksService,
    { provide: 'PUB_SUB', useValue: new PubSub() },
  ],
  exports: [TasksService],
})
export class TasksModule {}
