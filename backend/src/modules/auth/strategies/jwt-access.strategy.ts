import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { ACCESS_TOKEN_COOKIE } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * JwtAccessStrategy — validates the short-lived access token on every protected request.
 *
 * This is the main authentication gate for the entire API.
 * Every route decorated with @UseGuards(JwtAuthGuard) runs through this strategy.
 *
 * What Passport does automatically:
 *   1. Intercepts the incoming HTTP request
 *   2. Runs the jwtFromRequest extractors to find the token
 *   3. Verifies the token's signature using secretOrKey
 *   4. Checks the token hasn't expired
 *   5. If all checks pass, calls our validate() method with the decoded payload
 *   6. Attaches whatever validate() returns to request.user
 *
 * Token extraction order (first non-null value wins):
 *   1. httpOnly cookie named 'access_token'  → production browser flow
 *   2. Authorization: Bearer <token> header  → Postman / API clients / mobile apps
 *
 * Named 'jwt' — this name is what JwtAuthGuard references via AuthGuard('jwt').
 */

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Try cookie first, fall back to Authorization header.
      // The fallback is useful for testing in Postman where you
      // can't easily set httpOnly cookies manually.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[ACCESS_TOKEN_COOKIE] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret')!,
    });
  }

  /**
   * Called ONLY after Passport confirms the token is valid (signature + expiry).
   *
   * We do a fresh DB lookup here to:
   *   - Confirm the user still exists (wasn't deleted after token was issued)
   *   - Confirm the user is still active (wasn't deactivated)
   *
   * The object we return here becomes request.user, accessible via @CurrentUser().
   * We strip sensitive fields so downstream code never accidentally leaks them.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const { hashedPassword, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
