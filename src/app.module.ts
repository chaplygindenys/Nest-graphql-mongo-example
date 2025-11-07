// src/app.module.ts
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import type { GqlContextArg } from './common/types';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // optionally: envFilePath: ['.env'], // default is .env at project root
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: false, // disable old Playground
      introspection: true, // keep for dev
      // csrfPrevention: false, // (optional) you can disable CSRF in dev
      // IMPORTANT: no built-in subscriptions with AS4
      subscriptions: {
        'graphql-ws': false,
        'subscriptions-transport-ws': false,
      },
      // this context runs for each request (query/mutation/subscription)
      // we use it to add auth info to the context

      context: ({ req, extra, connectionParams }: GqlContextArg) => {
        // put token in a consistent place for JwtGuard
        const authorization =
          req?.headers?.authorization ??
          connectionParams?.authorization ??
          extra?.authorization;
        return { req, authorization, connectionParams, extra };
      },
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const uri = cfg.getOrThrow<string>('MONGO_URI');

        console.log(`Connecting to MongoDB at ${uri}`);

        return {
          uri: cfg.getOrThrow<string>('MONGO_URI'),
        };
      },
    }),
    TasksModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService], // <-- Add this line
})
export class AppModule {}
