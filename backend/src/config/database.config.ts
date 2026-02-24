import { registerAs } from '@nestjs/config';

/**
 * Database configuration namespace.
 * Prisma reads DATABASE_URL directly from the environment,
 * but having it here allows other parts of the app to reference
 * the database URL through the config service if needed.
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
