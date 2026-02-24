import { registerAs } from '@nestjs/config';

/**
 * App configuration namespace.
 *
 * registerAs('app', ...) groups these values under the 'app' namespace.
 * Inject with: configService.get('app.port') or configService.get<AppConfig>('app')
 *
 * This pattern avoids one giant flat config object and makes it easy to
 * inject only the config slice a module actually needs.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 8006,
  origin: process.env.APP_ORIGIN || 'http://localhost:3006',
}));
