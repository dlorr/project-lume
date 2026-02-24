import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule wires together all authentication concerns.
 *
 * JwtModule.register({}) — we pass an empty config here intentionally.
 * The actual secrets and expiry times are passed per-call in AuthService.generateTokens().
 * This allows us to sign access and refresh tokens with different secrets
 * from the same JwtService instance.
 *
 * PassportModule sets up the Passport.js integration.
 * defaultStrategy: 'jwt' means guards that don't specify a strategy
 * will use JwtAccessStrategy by default.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Secrets handled per-call in AuthService
  ],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService], // Export if other modules need auth utilities
})
export class AuthModule {}
