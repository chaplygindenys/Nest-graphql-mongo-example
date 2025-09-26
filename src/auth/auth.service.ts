import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserModel } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel.name) private readonly users: Model<UserDocument>,
    private readonly jwt: JwtService,
  ) {}

  async findOrCreateFromGoogle(profile: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    let user = await this.users.findOne({ googleId: profile.id }).exec();
    if (!user) {
      user = await this.users.create({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      });
    } else {
      // optional: keep profile fresh
      const changed =
        (profile.name && user.name !== profile.name) ||
        (profile.picture && user.picture !== profile.picture) ||
        user.email !== profile.email;
      if (changed) {
        user.name = profile.name ?? user.name;
        user.picture = profile.picture ?? user.picture;
        user.email = profile.email;
        await user.save();
      }
    }
    return user;
  }

  async fromGithubProfile(profile: any) {
    const gid = String(profile.id);
    let user = await this.users.findOne({ githubId: gid }).exec();
    if (!user) {
      user = await this.users.create({
        githubId: gid,
        login: profile.username,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatarUrl: profile.photos?.[0]?.value,
      });
    }
    const token = await this.jwt.signAsync({ sub: user.id, githubId: gid });
    return { user, token };
  }

  sign(user: UserDocument) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}
