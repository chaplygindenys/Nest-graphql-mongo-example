import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000', // same-origin calls
      'http://localhost:5173', // e.g. Vite dev server (adjust as needed)
      /https:\/\/.*\.ngrok-free\.app$/, // any ngrok url
      'https://chaplygindenys.github.io', // GH Pages domain (optional)
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  });

  // DEV: allow all origins — we’ll lock this down later
  // app.enableCors({
  //   origin: true,
  //   methods: ['GET', 'POST', 'OPTIONS'],
  //   credentials: false,
  // });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // tiny request logger to see callers/origins quickly
  app.use((req: any, _res: any, next: any) => {
    console.log(
      `[${req.method}] ${req.originalUrl} Origin=${req.headers.origin ?? '-'}`,
    );
    next();
  });

  await app.listen(process.env.PORT || 3000);
  console.log(
    `🚀 Server at http://localhost:${process.env.PORT || 3000}/graphql`,
  );
}
bootstrap();
