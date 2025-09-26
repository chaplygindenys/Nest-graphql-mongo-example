// src/auth/github.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(cfg: ConfigService) {
    super({
      clientID: cfg.getOrThrow('GITHUB_CLIENT_ID'),
      clientSecret: cfg.getOrThrow('GITHUB_CLIENT_SECRET'),
      callbackURL: cfg.getOrThrow('GITHUB_CALLBACK_URL'),
      scope: ['read:user','user:email'],
    });
  }
  // profile = GitHub profile
  validate(_acc: any, _ref: any, profile: any, done: any) {
    done(null, profile);
  }
}
