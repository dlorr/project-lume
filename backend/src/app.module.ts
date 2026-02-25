import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/project.module';
import { BoardsModule } from './modules/boards/boards.module';
import { StatusesModule } from './modules/statuses/statuses.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { CommentsModule } from './modules/comments/comments.module';

/**
 * AppModule is the root module — the entry point of the dependency injection tree.
 *
 * Everything that should be globally available is configured here.
 * Feature modules (auth, users, projects, etc.) will be imported here in Phase 3.
 */
@Module({
  imports: [
    /**
     * ConfigModule — makes environment variables available throughout the app.
     *
     * isGlobal: true → No need to import ConfigModule in every feature module.
     *   You can inject ConfigService anywhere once it's registered here.
     *
     * load: [...] → Registers our namespaced config factories (app, database, jwt).
     *   This gives us typed, namespaced access instead of raw process.env strings.
     *
     * envFilePath: '.env' → Loads the .env file in development.
     *   In production (Docker/cloud), environment variables come from the host,
     *   not from a file, so this is safely ignored when no .env file exists.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    /**
     * LoggerModule (Pino) — structured, high-performance logging.
     *
     * In development: pino-pretty formats logs in a human-readable colorized format.
     * In production: raw JSON output is ideal for log aggregation services
     *   (Datadog, AWS CloudWatch, Grafana Loki, etc.).
     *
     * autoLogging: true → Automatically logs every incoming HTTP request
     *   and its response status code. No need to add logging to every controller.
     */
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true }, // Keeps each log on one line in dev
              }
            : undefined, // Undefined = raw JSON in production
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        autoLogging: true,
      },
    }),

    // Global database module — PrismaService is available everywhere
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    BoardsModule,
    StatusesModule,
    TicketsModule,
    CommentsModule,
  ],
})
export class AppModule {}
