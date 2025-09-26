import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class UserModel {
  // Google OAuth fields
  @Prop({ required: true, unique: true, index: true }) googleId!: string;
  @Prop() name?: string;
  @Prop() picture?: string;
  @Prop({ required: true, unique: true, index: true }) email!: string;

  // GitHub OAuth fields
  @Prop({ index: true, unique: true }) githubId!: string;
  @Prop() login?: string;
  @Prop() avatarUrl?: string;
}

export type UserDocument = HydratedDocument<UserModel>;
export const UserSchema = SchemaFactory.createForClass(UserModel);
