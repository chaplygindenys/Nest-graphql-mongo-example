// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Context } from 'graphql-ws';
import { Extra, useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { AppModule } from './app.module';

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

  // WS server on the same path as HTTP (/graphql)
  const wss = new WebSocketServer({ server: httpServer, path: '/graphql' });

  useServer(
    {
      schema,
      context: async (ctx: Context /*, msg, args */) => {
        const auth =
          (ctx.connectionParams?.authorization as string | undefined) ??
          (ctx.connectionParams?.Authorization as string | undefined) ??
          '';

        // `Extra` includes the underlying ws request
        const req = (ctx.extra as Extra).request;

        return { authorization: auth, req };
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
