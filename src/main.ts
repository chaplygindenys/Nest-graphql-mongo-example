// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { log } from 'console';
import { useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { AppModule } from './app.module';
import { getUserId } from './common/auth-ids';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORS (adjust origins to your setup) ---
  app.enableCors({
    origin: [
      'http://localhost:3000', // same-origin calls (dev)
      'http://localhost:5173', // Vite dev server
      /https:\/\/.*\.ngrok-free\.app$/, // any ngrok tunnel
      'https://chaplygindenys.github.io', // GH Pages (if you use it)
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
    credentials: false, // true only if you use cookies
    maxAge: 86400,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // tiny request logger (optional)
  app.use((req: any, _res: any, next: any) => {
    console.log(
      `[${req.method}] ${req.originalUrl} Origin=${req.headers.origin ?? '-'}`,
    );
    next();
  });

  // Create raw HTTP server so WS can share the same port
  const httpServer = createServer(app.getHttpAdapter().getInstance());

  await app.init();

  // Share the GraphQL schema with graphql-ws
  const { schema } = app.get(GraphQLSchemaHost);
  const jwt = app.get(JwtService);

  // ...

  const wss = new WebSocketServer({ server: httpServer, path: '/graphql' });
  /**
  useServer<Context, Extra>(
    {
      schema,
      keepAlive: 12000,

      onConnect: (ctx) => {
        const ip = ctx.extra.request.socket.remoteAddress;
        console.log('[WS] connect from', ip);
      },

      onSubscribe: async (ctx, msg) => {
        const raw = (ctx.connectionParams?.Authorization ??
          ctx.connectionParams?.authorization ??
          '') as string;

        const token = raw.replace(/^Bearer\s+/i, '');
        let user: any = null;
        if (token) {
          try {
            user = jwt.verify(token); // { userId, ... }
          } catch (e) {
            console.warn('[WS] bad JWT in connectionParams');
          }
        }
        (ctx.extra as any).user = user; // available in resolvers via ctx.extra
        console.log(
          '[WS] subscribe op=%s user=%s',
          msg.payload.operationName ?? '-',
          user?.userId ?? '-',
        );
        return undefined; // proceed
      },

      onNext: (_ctx, _msg, _args, result) => {
        console.log(
          '[WS] delivered data keys:',
          Object.keys((result as any).data ?? {}),
        );
      },

      onError: (_ctx, _msg, errors) => {
        console.error('[WS] error:', errors);
      },

      onClose: (ctx, code, reason) => {
        console.log('[WS] closed', code, reason.toString());
      },

      // what resolvers receive as "ctx"
      context: (ctx) => ({
        req: ctx.extra.request,
        extra: ctx.extra,
        authorization: (ctx.connectionParams?.Authorization ??
          ctx.connectionParams?.authorization ??
          '') as string,
      }),
    },
    wss,
  );
*/
  useServer(
    {
      schema,
      onConnect: (ctx) => {
        const ip = (ctx.extra.request.socket as any).remoteAddress;
        console.log('[WS] connect from:', ip);
        return { ok: true, serverTime: new Date().toISOString(), ip };
      },
      onSubscribe: async (ctx, msg) => {
        const raw = (ctx.connectionParams?.authorization ??
          ctx.connectionParams?.Authorization ??
          '') as string;

        const token = raw.replace(/^Bearer\s+/i, '');
        let user: any = null;

        if (token) {
          try {
            user = jwt.verify(token); // <-- uses your Nest secret
            log('[WS] JWT verified user=%s', user);
          } catch (e: any) {
            console.warn('[WS] bad JWT in connectionParams:', e?.message ?? e);
          }
        }

        (ctx.extra as any).user = user; // <- make available to resolvers
        console.log('[WS] subscribe op=%s user=%s', msg, getUserId(user));
        return; // proceed
      },
      context: async (ctx /*, msg, args */) => {
        // Make the same info available through GraphQL ctx
        const rawAuth = (ctx.connectionParams?.authorization ??
          ctx.connectionParams?.Authorization ??
          '') as string;

        return {
          req: ctx.extra.request,
          extra: ctx.extra,
          authorization: rawAuth,
          user: (ctx.extra as any).user,
        };
      },
      onNext: (_ctx, _msg, _args, result) => {
        console.log(
          '[WS] delivered data keys:',
          Object.keys((result as any) ?? {}),
        );
      },
      onComplete: () => {
        console.log('[WS] closed 1000 Normal Closure');
      },
    },
    wss,
  );

  const PORT = Number(process.env.PORT ?? 3000);
  await new Promise<void>((resolve) => httpServer.listen(PORT, resolve));
  console.log(`HTTP  : http://localhost:${PORT}/graphql`);
  console.log(`WS    : ws://localhost:${PORT}/graphql`);
}
bootstrap();
