import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => {
  const gql = GqlExecutionContext.create(ctx);
  return gql.getContext().req.user as { userId: string; githubId: string } | undefined;
});
