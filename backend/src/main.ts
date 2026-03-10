import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 8006);

  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI });

  app.use(cookieParser());

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

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: configService.get('app.origin'),
    credentials: true,
  });

  await app.listen(port);
}

bootstrap();
