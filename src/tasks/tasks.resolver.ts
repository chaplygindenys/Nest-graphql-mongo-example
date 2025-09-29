import { Inject, Injectable, PipeTransform, UseGuards } from '@nestjs/common';
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
import { JwtGuard } from 'src/auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

import type { GqlContextArg as GqlContext, JwtUser } from '../common/types';

@Injectable()
class LogArgsPipe implements PipeTransform {
  transform(value: any) {
    console.log('[pipe] args before DTO:', value);
    return value;
  }
}

@Resolver(() => Task)
@UseGuards(JwtGuard)
export class TasksResolver {
  constructor(
    private readonly service: TasksService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  // ---------- Queries ----------
  @Query(() => [Task])
  tasks(@CurrentUser() user: JwtUser) {
    console.log('[resolver] tasks user:', user);
    const tasks = this.service.findAllByUser(user.id);
    console.log('[resolver] tasks count:', tasks);

    return tasks;
  }

  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.service.findOne(id);
  }

  // ---------- Mutations ----------
  @Mutation(() => Task)
  createTask(@Args('input') input: CreateTaskInput, @CurrentUser() u: JwtUser) {
    console.log('[resolver] createTask input:', input, u);
    const userId = u.id;
    return this.service.create(input, userId);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('input', new LogArgsPipe()) input: UpdateTaskInput,
    @CurrentUser() u: JwtUser,
    @Context() ctx: GqlContext, // typed context (HTTP or WS)
  ) {
    console.log('[resolver] updateTask input:', input);
    console.log('[resolver] raw variables (HTTP):', ctx.req?.body?.variables);
    console.log('[resolver] conn params (WS):', ctx.connectionParams);
    return this.service.update(input, u.id);
  }

  @Mutation(() => Task)
  deleteTask(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() u: JwtUser,
  ) {
    return this.service.remove(id, u.id);
  }

  // Optional, if you still keep it:
  @Mutation(() => Task)
  toggleTask(@Args('id', { type: () => ID }) id: string) {
    return this.service.toggle(id);
  }

  // ---------- Subscriptions ----------
  @Subscription(() => Task, {
    name: 'taskAdded',
    filter: (payload: { userId?: string }, _vars: unknown, ctx: GqlContext) => {
      const ctxUserId =
        (ctx.req as any)?.user?.userId ?? (ctx.extra as any)?.user?.userId;
      return !!payload.userId && ctxUserId === payload.userId;
    },
  })
  taskAdded() {
    return this.pubSub.asyncIterableIterator('taskAdded');
  }

  @Subscription(() => Task, {
    name: 'taskUpdated',
    filter: (payload: { userId?: string }, _vars: unknown, ctx: GqlContext) => {
      const ctxUserId =
        (ctx.req as any)?.user?.userId ?? (ctx.extra as any)?.user?.userId;
      return !!payload.userId && ctxUserId === payload.userId;
    },
  })
  taskUpdated() {
    return this.pubSub.asyncIterableIterator('taskUpdated');
  }

  @Subscription(() => Task, {
    name: 'taskDeleted',
    filter: (payload: { userId?: string }, _vars: unknown, ctx: GqlContext) => {
      const ctxUserId =
        (ctx.req as any)?.user?.userId ?? (ctx.extra as any)?.user?.userId;
      return !!payload.userId && ctxUserId === payload.userId;
    },
  })
  taskDeleted() {
    return this.pubSub.asyncIterableIterator('taskDeleted');
  }
}
