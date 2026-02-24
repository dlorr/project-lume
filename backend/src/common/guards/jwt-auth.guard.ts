import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard protects routes that require a valid access token.
 *
 * Usage on a controller or route handler:
 *   @UseGuards(JwtAuthGuard)
 *
 * Internally, it triggers JwtAccessStrategy ('jwt') to validate the Bearer token.
 * If validation fails, a 401 Unauthorized is returned automatically.
 *
 * In Phase 3 we'll make this the default guard globally,
 * and use a @Public() decorator to opt-out specific routes (like login/register).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
