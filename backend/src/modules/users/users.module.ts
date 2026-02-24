import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * UsersModule encapsulates all user-related logic.
 * We export UsersService so AuthModule can import and use it.
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
