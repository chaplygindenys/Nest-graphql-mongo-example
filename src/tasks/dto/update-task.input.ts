import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateTaskInput {
  @Field(() => ID)
  @IsString()
  @IsMongoId()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
