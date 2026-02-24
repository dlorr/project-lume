import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Import from the generated output path — NOT from '@prisma/client' anymore.
// Prisma v7 generates the client locally so it's fully typed to YOUR schema.
import { PrismaClient } from 'src/generated/prisma/client';

// Import the PostgreSQL driver adapter.
// Prisma v7 requires an explicit adapter — it no longer bundles the DB driver itself.
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService wraps the Prisma client and integrates it with NestJS lifecycle hooks.
 *
 * - OnModuleInit:   Opens the DB connection when the NestJS module initializes.
 *                   This causes a fail-fast on startup if the DB is unreachable.
 * - OnModuleDestroy: Gracefully closes the DB connection on app shutdown (SIGTERM etc.)
 *                   Prevents connection pool leaks in production.
 *
 * We extend PrismaClient directly so injecting PrismaService gives you full
 * Prisma query access: this.prisma.user.findMany(), etc.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Create the PostgreSQL adapter using the DATABASE_URL from environment variables.
    // The adapter is what actually communicates with your PostgreSQL server.
    const connectionString = `${process.env.DATABASE_URL}`;
    const adapter = new PrismaPg({ connectionString });

    // Pass the adapter to PrismaClient via super().
    // This replaces the old implicit driver bundling from Prisma v5.
    super({ adapter });
  }

  async onModuleInit() {
    // Explicitly connect on startup rather than waiting for the first query.
    // This surfaces DB connection issues immediately — fail fast is a production best practice.
    await this.$connect();
  }

  async onModuleDestroy() {
    // Cleanly close all DB connections when the app is shutting down.
    // Without this, you may get connection pool warnings or zombie connections.
    await this.$disconnect();
  }
}
