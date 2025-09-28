import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GithubProfileLite } from './github.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async github() {
    // Passport will redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCb(
    @Req() req: Request & { user: GithubProfileLite | undefined },
    @Res() res: Response,
  ) {
    console.log('req.user', req.user);

    if (!req.user) return res.status(401).send('No user from GitHub');

    const { token } = await this.auth.fromGithubProfile(req.user);
    return res.redirect(this.buildFrontendRedirect(token, req));
  }

  /** Optionally expose a simple health/debug endpoint */
  @Get('ok')
  ok() {
    return { ok: true };
  }

  /** Build a safe redirect to your frontend, adding token as a hash */
  private buildFrontendRedirect(token: string, req: Request): string {
    const base = this.cfg.getOrThrow<string>('FRONTEND_URL'); // e.g. http://localhost:5173/nest-graphql-mongo-client/
    const u = new URL(base);

    // Optional: honor a `state` or `returnTo` query sent at /auth/... ?returnTo=/foo
    const returnTo =
      (typeof req.query.returnTo === 'string' &&
      req.query.returnTo.startsWith('/')
        ? req.query.returnTo
        : '') || '';

    if (returnTo) {
      // avoid duplicate slashes
      u.pathname = `${u.pathname.replace(/\/+$/, '')}${returnTo}`;
    }

    // We return the JWT in the URL fragment so no cookies are needed (good for GH Pages)
    u.hash = `token=${encodeURIComponent(token)}`;
    return u.toString();
  }
}
