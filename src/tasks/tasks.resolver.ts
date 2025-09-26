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
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { JwtGuard } from 'src/auth/jwt.guard';

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

  @Query(() => [Task])
  tasks(@CurrentUser() user: { userId: string }) {
    return this.service.findAllByUser(user.userId);
  }

  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Task)
  createTask(
    @Args('input') input: CreateTaskInput,
    @CurrentUser() u: { userId: string },
  ) {
    return this.service.create(input, u.userId);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('input', new LogArgsPipe()) input: UpdateTaskInput,
    @CurrentUser() u: { userId: string },
    @Context() ctx: any, // optional: to see req.body too
  ) {
    console.log('[resolver] updateTask input:', input); // what the DTO sees
    console.log('[resolver] raw variables:', ctx?.req?.body?.variables); // raw vars
    return this.service.update(input, u.userId);
  }

  @Mutation(() => Task)
  deleteTask(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() u: { userId: string },
  ) {
    return this.service.remove(id, u.userId);
  }

  @Mutation(() => Task)
  toggleTask(@Args('id', { type: () => ID }) id: string) {
    return this.service.toggle(id);
  }

  /**@Subscription(() => Task, {
  name: 'taskAdded',
  filter: (payload, _vars, ctx) => payload.userId === ctx.req.user?.userId,
})
taskAdded() { return this.pubSub.asyncIterableIterator('taskAdded'); }
 */

  @Subscription(() => Task, {
    name: 'taskAdded',
    filter: (payload, _vars, ctx) => payload.userId === ctx.req.user?.userId,
  })
  taskAdded() {
    return this.pubSub.asyncIterableIterator('taskAdded');
  }

  @Subscription(() => Task, {
    name: 'taskUpdated',
    filter: (payload, _vars, ctx) => payload.userId === ctx.req.user?.userId,
  })
  taskUpdated() {
    return this.pubSub.asyncIterableIterator('taskUpdated');
  }

  @Subscription(() => Task, {
    name: 'taskDeleted',
    filter: (payload, _vars, ctx) => payload.userId === ctx.req.user?.userId,
  })
  taskDeleted() {
    return this.pubSub.asyncIterableIterator('taskDeleted');
  }
}
