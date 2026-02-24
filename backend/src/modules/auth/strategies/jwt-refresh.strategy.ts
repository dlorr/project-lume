import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { REFRESH_TOKEN_COOKIE } from '../auth.service';

/**
 * JwtRefreshStrategy — validates the long-lived refresh token on the /auth/refresh route.
 *
 * This strategy has ONE job: verify that a refresh token is legitimate
 * before issuing a new access token. It's stricter than the access strategy
 * because a compromised refresh token is much more dangerous (7 day lifetime).
 *
 * Key differences from JwtAccessStrategy:
 *
 *   1. Different secret (jwt.refreshSecret)
 *      A forged access token cannot be used as a refresh token.
 *      Even if the access secret leaks, refresh tokens stay safe.
 *
 *   2. Named 'jwt-refresh' (not 'jwt')
 *      JwtRefreshGuard uses AuthGuard('jwt-refresh') to trigger THIS strategy,
 *      not the access strategy. They are completely independent.
 *
 *   3. passReqToCallback: true as const
 *      Tells Passport to pass the raw Request object as the first argument
 *      to validate(). Without this, validate() only receives the JWT payload.
 *      We need the Request to read the raw cookie value for hash comparison.
 *
 *   4. DB hash comparison
 *      After verifying the JWT signature, we ALSO compare the raw cookie value
 *      against the bcrypt hash stored in the database.
 *      This enables server-side token revocation — if the user logged out,
 *      the hash is null and the comparison fails regardless of token validity.
 *      It also detects token reuse after rotation (stolen token scenario).
 *
 * Named 'jwt-refresh' — referenced by JwtRefreshGuard via AuthGuard('jwt-refresh').
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Extract the refresh token from the httpOnly cookie instead of the header.
      // The browser sends it automatically — the frontend JS never touches it.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true as const,
    });
  }

  /**
   * Called after Passport verifies the refresh token's signature and expiry.
   *
   * We perform an additional layer of validation here:
   *
   *   Step 1: Extract the raw refresh token from the cookie
   *   Step 2: Load the user from the DB and check they're active
   *   Step 3: bcrypt.compare the raw token against the stored hash
   *           → If the user logged out, storedToken is null → rejected
   *           → If tokens were rotated, old token won't match new hash → rejected
   *           → Only the most recently issued refresh token will match
   *
   * The returned object becomes request.user in the controller,
   * giving AuthController access to userId and email to issue new tokens.
   */
  async validate(req: Request, payload: { sub: string; email: string }) {
    // Read the raw refresh token from the cookie
    const refreshToken = req?.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    const { hashedPassword, refreshToken: storedToken, ...safeUser } = user;
    return safeUser;
  }
}
