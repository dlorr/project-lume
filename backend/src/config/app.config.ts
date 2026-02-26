import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 8006,
  origin: process.env.APP_ORIGIN || 'http://localhost:3006',
}));
