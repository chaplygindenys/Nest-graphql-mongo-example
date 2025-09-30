import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// src/users/user.schema.ts (or wherever your user model is)
@Schema({ timestamps: true })
export class UserModel {
  @Prop({ required: true, unique: true })
  githubId!: string; // <-- unique

  @Prop() username?: string;
  @Prop() displayName?: string;
  @Prop() email?: string;
  @Prop() avatarUrl?: string;
}

export type UserDocument = HydratedDocument<UserModel>;
export const UserSchema = SchemaFactory.createForClass(UserModel);
