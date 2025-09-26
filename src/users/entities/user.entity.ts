import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID) id!: string;
  @Field() googleId!: string;
  @Field() email!: string;
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) picture?: string;
}
