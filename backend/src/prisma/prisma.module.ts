import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule provides the database client to the entire application.
 *
 * @Global() makes this module available everywhere without needing to import it
 * into each feature module individually. This is appropriate for truly
 * infrastructure-level services like the database — it's not a feature, it's a utility.
 *
 * Think of it like registering a singleton in a DI container globally.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export so other modules can inject PrismaService
})
export class PrismaModule {}
