import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtRefreshGuard protects the token refresh endpoint.
 *
 * Only the /auth/refresh route uses this guard.
 * It triggers JwtRefreshStrategy ('jwt-refresh') which validates
 * the refresh token AND verifies it against the stored hash.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
