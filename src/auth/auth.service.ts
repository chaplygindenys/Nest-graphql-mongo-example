// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from '../users/user.schema';
import type { GithubProfileLite } from './github.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel.name) private users: Model<UserModel>,
    private jwt: JwtService,
  ) {}

  async fromGithubProfile(p: GithubProfileLite) {
    // 1) find-or-create user by githubId
    let user = await this.users.findOne({ githubId: p.githubId }).lean();
    if (!user?.githubId) {
      user = await this.users
        .create({
          githubId: p.githubId,
          username: p.username ?? undefined,
          displayName: p.displayName ?? undefined,
          email: p.email ?? undefined,
          avatarUrl: p.avatarUrl ?? undefined,
        })
        .then((u) => u.toObject());
    }

    if (!user) throw new Error('Could not create/find user after Github login');

    // 2) sign JWT: put your internal user id into `sub`
    const payload = {
      sub: user._id.toString(), // <-- used as userId in your guards/resolvers
      githubId: user.githubId, // optional, keep if you want
    };

    const token = await this.jwt.signAsync(payload);

    return { user, token };
  }

  sign(user: { _id: string; githubId?: string; username?: string }) {
    return this.jwt.sign({
      sub: user._id.toString(),
      githubId: user.githubId,
      username: user.username,
    });
  }
}
