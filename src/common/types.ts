// src/common/types.ts
import type { Request as ExpressRequest, Request, Response } from 'express';
import type { ConnectionInitMessage } from 'graphql-ws';
import type { IncomingHttpHeaders, IncomingMessage } from 'http';

export type JwtUser = {
  id: string; // user id
  sub: string; // user id
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

export type JwtPayload = {
  sub: string;
  iat?: number;
  exp?: number;
};

export type GqlContext = {
  req: Request & { user?: JwtUser };
  res: Response;
  // we put token here in app.module context() for guards
  authorization?: string | null;
  // ws
  connectionParams?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

// types/graphql-context.ts

// The payload clients send on graphql-ws connection init
export type GqlWsConnectionParams =
  | (ConnectionInitMessage['payload'] & { authorization?: string })
  | undefined;

// Extra info provided by graphql-ws (request, socket, etc.)
export type GqlWsExtra = { authorization: string; request: IncomingMessage };

// HTTP request type (support either platform)
export type HttpReq = ExpressRequest & { headers: IncomingHttpHeaders };

// The context argument Nest/Apollo passes into your context() factory.
// It can be HTTP or WS; properties you don't get on that transport are undefined.
export type GqlContextArg = {
  req?: HttpReq; // present on HTTP ops
  extra?: GqlWsExtra; // present on WS (subscriptions)
  connectionParams?: GqlWsConnectionParams; // present on WS (from client)
};
