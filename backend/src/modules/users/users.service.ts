import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from 'src/generated/prisma/client';

/**
 * UsersService handles all database operations related to users.
 *
 * It's kept separate from AuthService intentionally:
 * - AuthService handles authentication LOGIC (tokens, hashing, validation)
 * - UsersService handles user DATA (find, create, update)
 *
 * This separation means other modules (e.g. ProjectsModule) can
 * inject UsersService to look up users without pulling in auth logic.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their email address.
   * Used during login to retrieve the user for password comparison.
   *
   * Returns the full user object INCLUDING the hashed password.
   * Never return this directly from a controller — always strip sensitive fields first.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by their ID.
   * Used by JWT strategy to attach the current user to the request.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by username — used during registration to check uniqueness.
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Update the user's stored refresh token hash.
   *
   * We store a HASH of the refresh token, not the raw token.
   * This means even if your database is compromised, attackers
   * can't use the stored values as refresh tokens.
   *
   * Pass null to clear it (i.e. on logout).
   */
  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
