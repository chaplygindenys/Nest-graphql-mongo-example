import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    cfg: ConfigService,
    private auth: AuthService,
  ) {
    super({
      clientID: cfg.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: cfg.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: cfg.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(_at: string, _rt: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const picture = profile.photos?.[0]?.value;
    const user = await this.auth.findOrCreateFromGoogle({
      id: profile.id,
      email: email!,
      name: profile.displayName,
      picture,
    });
    return user; // attaches to req.user
  }
}
