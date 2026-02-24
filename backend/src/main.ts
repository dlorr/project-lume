import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // bufferLogs: true — hold all logs in a buffer until our custom Pino logger
  // is attached. Without this, early startup logs use NestJS's default logger
  // and won't be formatted consistently.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Replace NestJS's default logger with Pino for structured JSON logging.
  // In dev: pretty-printed. In prod: raw JSON for log aggregators (Datadog, CloudWatch).
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 8006);
  // All routes will be prefixed with /api
  // e.g. /api/v1/auth/login, /api/v1/projects
  app.setGlobalPrefix('api');

  // URI versioning: version is part of the URL path
  // /api/v1/... and /api/v2/... can coexist — great for non-breaking API evolution
  app.enableVersioning({ type: VersioningType.URI });

  // Cookie parser must be registered BEFORE any guards or interceptors
  // that need to read cookies — otherwise req.cookies will be undefined
  app.use(cookieParser());

  /**
   * Global ValidationPipe — the gatekeeper for all incoming request bodies.
   *
   * whitelist: true
   *   → Automatically strips any property from the request body that is NOT
   *     declared in the DTO. Prevents mass assignment attacks where a client
   *     sends unexpected fields like { "isAdmin": true }.
   *
   * forbidNonWhitelisted: true
   *   → Goes one step further: instead of silently stripping unknown properties,
   *     it throws a 400 Bad Request. Makes your API stricter and easier to debug.
   *
   * transform: true
   *   → Automatically transforms plain JSON objects into typed DTO class instances.
   *     This enables class-validator decorators to work AND allows you to use
   *     class methods on your DTOs if needed.
   *
   * transformOptions.enableImplicitConversion: true
   *   → Allows implicit type coercion based on TypeScript types.
   *     e.g. a query param "?page=1" arrives as string "1" but gets converted
   *     to number 1 if your DTO declares it as @Type(() => Number).
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Register the global exception filter — handles ALL unhandled exceptions
  // and returns a consistent error shape to the client
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS configuration:
  // In development, allow all origins for ease of local frontend development.
  // In production, restrict to your actual frontend domain.
  app.enableCors({
    origin:
      configService.get('app.nodeEnv') === 'production'
        ? configService.get('app.origin')
        : '*',
    credentials: true, // Required if your frontend sends cookies (refresh token cookie)
  });

  await app.listen(port);
}

bootstrap();
