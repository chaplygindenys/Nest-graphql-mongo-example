// src/app.module.ts
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
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
     // csrfPrevention: false, // <— dev only

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
  ],
})
export class AppModule {}
