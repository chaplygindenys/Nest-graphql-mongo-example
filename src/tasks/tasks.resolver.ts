import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly service: TasksService) {}

  @Query(() => [Task], { name: 'tasks' })
  findAll() {
    return this.service.findAll();
  }

  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.service.findOne(id);
  }

  @Mutation(() => Task)
  createTask(@Args('input') input: CreateTaskInput) {
    return this.service.create(input);
  }

  @Mutation(() => Task)
  updateTask(@Args('input') input: UpdateTaskInput) {
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
}
