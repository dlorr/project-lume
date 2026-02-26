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

export type PublicUser = Omit<User, 'hashedPassword' | 'refreshToken'>;

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, res: Response): Promise<PublicUser> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const existingUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const rounds = Number(this.configService.get<number>('BCRYPT_ROUNDS', 12));
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto, res: Response): Promise<PublicUser> {
    const user = await this.usersService.findByEmail(dto.email);

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

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.sanitizeUser(user);
  }

  async refreshTokens(
    userId: string,
    email: string,
    res: Response,
  ): Promise<{ message: string }> {
    const tokens = await this.generateTokens(userId, email);

    await this.storeRefreshToken(userId, tokens.refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Token refreshed successfully' };
  }

  async logout(userId: string, res: Response): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (user?.refreshToken) {
      await this.usersService.updateRefreshToken(userId, null);
    }

    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

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

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...COOKIE_BASE,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...COOKIE_BASE,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/api/v1/auth/refresh',
    });
  }

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

  private sanitizeUser(user: User): PublicUser {
    const { hashedPassword, refreshToken, ...safeUser } = user;
    return safeUser;
  }
}
