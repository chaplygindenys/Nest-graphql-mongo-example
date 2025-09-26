// src/auth/jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const gqlCtx = (ctx as any).getArgs ? ctx.getArgByIndex?.(2) : null;
    const req = gqlCtx?.req ?? ctx.switchToHttp().getRequest();
    const raw =
      req.headers?.authorization ??
      req.cookies?.token ??
      gqlCtx?.extra?.authorization ??
      gqlCtx?.connectionParams?.authorization;

    if (!raw) return false;
    const m = String(raw).match(/^Bearer\s+(.+)/i);
    const token = m ? m[1] : raw;
    try {
      const payload = jwt.verify(token, this.cfg.get('JWT_SECRET')!) as any;
      req.user = { id: payload.sub };
      gqlCtx.user = req.user; // for resolvers
      return true;
    } catch {
      return false;
    }
  }
}
