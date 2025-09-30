// src/auth/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

type GHEmail = {
  value: string;
  verified?: boolean;
  primary?: boolean;
  type?: string;
};

export type GithubProfileLite = {
  provider: 'github';
  githubId: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  raw: any; // optional, remove if you don't need it
  accessToken?: string; // avoid returning unless you truly need it
};

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(cfg: ConfigService) {
    super({
      clientID: cfg.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: cfg.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: cfg.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['read:user', 'user:email'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GithubProfileLite> {
    const emails = profile.emails as unknown as GHEmail[] | undefined;

    const email =
      emails?.find((e) => e.verified)?.value ??
      emails?.find((e) => e.primary)?.value ??
      emails?.[0]?.value ??
      null;

    return {
      provider: 'github',
      githubId: profile.id, // <-- use githubId here
      username: profile.username ?? null,
      displayName: profile.displayName ?? null,
      email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      raw: (profile as any)._json,
      // accessToken, // usually DON'T expose this to the client/JWT
    };
  }
}
