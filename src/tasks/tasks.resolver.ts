import { Inject, Injectable, PipeTransform } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

@Injectable()
class LogArgsPipe implements PipeTransform {
  transform(value: any) {
    console.log('[pipe] args before DTO:', value);
    return value;
  }
}

@Resolver(() => Task)
export class TasksResolver {
  constructor(
    private readonly service: TasksService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Query(() => [Task], { name: 'tasks' })
  findAll() {
    return this.service.findAll();
  }

  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Task)
  createTask(
    @Args('input', { type: () => CreateTaskInput }) input: CreateTaskInput,
  ) {
    return this.service.create(input);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('input', new LogArgsPipe()) input: UpdateTaskInput,
    @Context() ctx: any, // optional: to see req.body too
  ) {
    console.log('[resolver] updateTask input:', input); // what the DTO sees
    console.log('[resolver] raw variables:', ctx?.req?.body?.variables); // raw vars
    return this.service.update(input);
  }

  @Mutation(() => Task)
  deleteTask(@Args('id', { type: () => ID }) id: string) {
    return this.service.remove(id);
  }

  @Mutation(() => Task)
  toggleTask(@Args('id', { type: () => ID }) id: string) {
    return this.service.toggle(id);
  }

  @Subscription(() => Task, { name: 'taskAdded' })
  taskAdded() {
    return this.pubSub.asyncIterableIterator('taskAdded');
  }
  @Subscription(() => Task, { name: 'taskUpdated' })
  taskUpdated() {
    return this.pubSub.asyncIterableIterator('taskUpdated');
  }
  @Subscription(() => Task, { name: 'taskDeleted' })
  taskDeleted() {
    return this.pubSub.asyncIterableIterator('taskDeleted');
  }
}
