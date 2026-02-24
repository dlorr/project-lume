import { registerAs } from '@nestjs/config';

/**
 * JWT configuration namespace.
 *
 * We define separate secrets and expiry times for access and refresh tokens:
 * - Access token:  Short-lived (15m), used to authenticate API requests
 * - Refresh token: Long-lived (7d), used ONLY to get new access tokens
 *
 * Using different secrets for each token type means a compromised
 * refresh token cannot be used as an access token and vice versa.
 */
export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
