import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * AuthController handles all authentication routes.
 *
 * Route structure:
 *   POST /api/v1/auth/register  → Create account + Sets auth cookies and returns public user data in the body.
 *   POST /api/v1/auth/login     → Authenticate + Sets auth cookies and returns public user data in the body.
 *   POST /api/v1/auth/refresh   → Get new tokens using refresh token
 *   POST /api/v1/auth/logout    → Clear both cookies and invalidate the refresh token in the DB.
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register — returns public user data, sets auth cookies.
   * 201 Created is correct here — we ARE creating a resource (the user).
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    // passthrough: true is CRITICAL — without it, NestJS hands full response
    // control to you and interceptors/pipes stop working on the response.
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  /**
   * Login — returns public user data, sets auth cookies.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  /**
   * Refresh — rotates both tokens via cookies, returns success message.
   * The browser automatically sends the refresh_token cookie because
   * its path matches /api/v1/auth/refresh exactly.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() user: { id: string; email: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(user.id, user.email, res);
  }

  /**
   * Logout — clears cookies, invalidates refresh token in DB.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.id, res);
  }
}
