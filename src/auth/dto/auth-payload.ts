// src/auth/dto/auth-payload.ts
import { User } from '../../users/entities/user.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field() accessToken!: string;
  @Field(() => User) user!: User;
}
