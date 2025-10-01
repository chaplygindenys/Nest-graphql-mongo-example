// src/auth/jwt.guard.ts
/**
 * import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const gqlCtx = (ctx as any).getArgs ? ctx.getArgByIndex?.(2) : null;
    const req = gqlCtx?.req ?? ctx.switchToHttp().getRequest();
    log(
      '[Guard] JWT checking',
      req?.method,
      req?.url,
      gqlCtx ? '(GraphQL)' : '',
    );
    const raw =
      req.headers?.authorization ??
      req.cookies?.token ??
      gqlCtx?.extra?.authorization ??
      gqlCtx?.connectionParams?.authorization;

    console.log('[Guard] raw auth:', raw ?? '(none)');

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
  */

// src/auth/jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';

type JwtPayload = { sub: string; githubId?: string; [k: string]: any };
type AuthUser = { userId: string; githubId?: string };

function extractBearer(raw?: string): string | null {
  if (!raw) return null;
  const m = String(raw).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : raw;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // GraphQL (covers queries, mutations, *and* subscriptions)
    if (context.getType<'graphql'>() === 'graphql') {
      const gql = GqlExecutionContext.create(context);
      const ctx: any = gql.getContext(); // your GqlContext
      console.log('[Guard] GQL user :', ctx.extra?.user ?? ctx.req?.user);

      // WebSocket connection (subscription)
      // 1) If onSubscribe already verified, reuse it
      const existing = ctx?.extra?.user ?? ctx?.req?.user;
      if (existing) {
        ctx.req ??= {};
        ctx.req.user = existing;
        return true;
      }

      // 2) Otherwise try to extract token from the usual places
      const token =
        extractBearer(ctx?.authorization) ||
        extractBearer(ctx?.req?.headers?.authorization) ||
        extractBearer(ctx?.extra?.authorization) ||
        extractBearer(ctx?.connectionParams?.authorization) ||
        extractBearer(ctx?.req?.cookies?.token);

      if (!token) {
        throw new UnauthorizedException('Missing JWT');
      }

      const user = this.verifyToUser(token);
      // normalize for resolvers
      ctx.extra ??= {};
      ctx.extra.user = user;
      ctx.req ??= {};
      ctx.req.user = user;
      return true;
    }

    // Plain HTTP (REST) requests
    const req: any = context.switchToHttp().getRequest();
    const token =
      extractBearer(req?.headers?.authorization) ||
      extractBearer(req?.cookies?.token);

    if (!token) {
      throw new UnauthorizedException('Missing JWT');
    }

    req.user = this.verifyToUser(token);
    return true;
  }

  private verifyToUser(token: string): AuthUser {
    try {
      const payload = jwt.verify(
        token,
        this.cfg.getOrThrow<string>('JWT_SECRET'),
      ) as JwtPayload;
      return { userId: payload.sub, githubId: payload.githubId };
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
