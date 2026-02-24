import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/generated/prisma/client';

/**
 * Safe public user data — what we return in the response body.
 * Never includes hashedPassword, refreshToken, or any internal fields.
 */
export type PublicUser = Omit<User, 'hashedPassword' | 'refreshToken'>;

/**
 * Cookie configuration constants.
 *
 * httpOnly: true     → JS cannot read this cookie (blocks XSS token theft)
 * secure: true       → Cookie only sent over HTTPS (set false in dev for HTTP localhost)
 * sameSite: 'lax'   → Cookie sent on same-site requests + top-level navigations.
 *                      'strict' would break OAuth redirects. 'none' requires secure:true.
 * path              → Scope the refresh token cookie to only the refresh route,
 *                      so it's not sent on every single API request unnecessarily.
 */
const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // false in dev (localhost uses HTTP)
  sameSite: 'lax' as const,
};

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Access token: short-lived, 15 minutes
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
// Refresh token: long-lived, 7 days
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user account.
   *
   * Flow:
   *   1. Validate email + username uniqueness
   *   2. Hash the password with bcrypt
   *   3. Create user in DB
   *   4. Generate access + refresh tokens
   *   5. Store hashed refresh token in DB
   *   6. Set both tokens as httpOnly cookies on the response
   *   7. Return public user data in the response body
   */
  async register(dto: RegisterDto, res: Response): Promise<PublicUser> {
    // Check for existing email — prevents duplicate accounts
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check for existing username — usernames must be unique
    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash the password.
    // bcrypt automatically generates and embeds a salt.
    // BCRYPT_ROUNDS (default 12) controls the cost factor — higher = slower = more secure.
    // 12 rounds takes ~300ms which is acceptable for auth but discourages brute force.
    const rounds = Number(this.configService.get<number>('BCRYPT_ROUNDS', 12));
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    // Create the user record
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        hashedPassword,
      },
    });

    // Generate token pair and store hashed refresh token
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Set tokens in httpOnly cookies instead of returning them in the body
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Return only public user data — no tokens, no password hash
    return this.sanitizeUser(user);
  }

  /**
   * Authenticate an existing user.
   *
   * Security note: We always run bcrypt.compare even when the user doesn't exist.
   * This prevents timing attacks — an attacker cannot tell if an email is registered
   * by measuring how fast the server responds. Both paths take ~same time.
   *
   * We also always return the same error message regardless of whether the
   * email doesn't exist OR the password is wrong — this prevents user enumeration.
   */
  async login(dto: LoginDto, res: Response): Promise<PublicUser> {
    const user = await this.usersService.findByEmail(dto.email);

    // Always run bcrypt.compare even if user is null — this prevents
    // timing attacks where an attacker can tell if an email exists
    // based on how fast the response comes back.
    const passwordToCompare =
      user?.hashedPassword ?? '$2b$12$invalidhashfortimingattackprevention';
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      passwordToCompare,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Generate token pair and store hashed refresh token
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Set tokens in httpOnly cookies instead of returning them in the body
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Return only public user data — no tokens, no password hash
    return this.sanitizeUser(user);
  }

  /**
   * Issue a fresh token pair using a valid refresh token.
   *
   * Token rotation: every call to /auth/refresh invalidates the old
   * refresh token and issues a brand new one. This means:
   *   - Each refresh token is single-use
   *   - If a stolen token is used after the legitimate user refreshes,
   *     the hash won't match and it gets rejected
   */
  async refreshTokens(
    userId: string,
    email: string,
    res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.generateTokens(userId, email);

    // Rotate: invalidate the old refresh token by replacing it with the new hash
    await this.storeRefreshToken(userId, tokens.refreshToken);

    // Rotate both cookies — new access token + new refresh token
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Token refreshed successfully' };
  }

  /**
   * Log out — two things happen:
   *   1. The refresh token hash is deleted from the DB (server-side invalidation)
   *   2. Both cookies are cleared from the browser (client-side invalidation)
   *
   * The access token will naturally expire after 15 minutes.
   * For immediate access token revocation you'd need a Redis token blacklist
   * — that's a future enhancement outside MVP scope.
   */
  async logout(userId: string, res: Response): Promise<{ message: string }> {
    // Only clear if there's actually a token stored — avoids unnecessary DB writes
    const user = await this.usersService.findById(userId);
    if (user?.refreshToken) {
      await this.usersService.updateRefreshToken(userId, null);
    }

    // Clear cookies by setting them with maxAge 0
    // The browser will immediately discard them
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────

  /**
   * Generate an access + refresh token pair for a user.
   *
   * We sign each token with a DIFFERENT secret:
   *   - accessSecret  → for access tokens (short-lived)
   *   - refreshSecret → for refresh tokens (long-lived)
   *
   * Using different secrets means a leaked access secret cannot be
   * used to forge refresh tokens and vice versa — defense in depth.
   *
   * Promise.all() signs both tokens in parallel — no reason to wait
   * for one before starting the other.
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: { sub: string; email: string } = { sub: userId, email };

    const accessExpiresIn = this.configService.get<string>(
      'jwt.accessExpiresIn',
      '15m',
    ) as StringValue;

    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    ) as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Hash the refresh token and persist it to the database.
   *
   * We hash the refresh token for the same reason we hash passwords:
   * if someone dumps your database, they get bcrypt hashes — not usable tokens.
   *
   * Cost factor is 10 (vs 12 for passwords) because:
   *   - Refresh tokens are cryptographically random — not guessable like passwords
   *   - This runs on every login AND every refresh — performance matters here
   *   - Lower cost is still safe because the input has high entropy
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  /**
   * Write both auth tokens to httpOnly cookies on the HTTP response.
   *
   * Access token cookie:
   *   - path: '/'  → sent on every request to the API
   *   - maxAge: 15 minutes
   *
   * Refresh token cookie:
   *   - path: '/api/v1/auth/refresh' → browser ONLY sends this cookie to this exact path
   *   - maxAge: 7 days
   *   - Scoping the path means the refresh token isn't exposed on every API call,
   *     only when the client explicitly calls the refresh endpoint.
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...COOKIE_BASE,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      // Access token cookie is sent on all /api routes
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...COOKIE_BASE,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      // Scope the refresh token cookie to only the refresh endpoint.
      // This means the browser will NOT send it on every API request —
      // only when the frontend explicitly calls /auth/refresh.
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * Clear both auth cookies from the browser.
   *
   * Setting maxAge to 0 tells the browser: "this cookie has already expired,
   * delete it immediately". The empty string value doesn't matter —
   * the browser discards the cookie before it can be read.
   */
  private clearAuthCookies(res: Response): void {
    res.cookie(ACCESS_TOKEN_COOKIE, '', {
      ...COOKIE_BASE,
      maxAge: 0,
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE, '', {
      ...COOKIE_BASE,
      maxAge: 0,
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * Remove sensitive fields before returning user data to the client.
   * This is the ONLY shape of user data that should ever leave the server.
   */
  private sanitizeUser(user: User): PublicUser {
    const { hashedPassword, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
