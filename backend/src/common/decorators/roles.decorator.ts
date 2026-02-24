import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/generated/prisma/enums';

/**
 * Metadata key used by RolesGuard to read the required roles from a route.
 * Exported so RolesGuard can reference the same key.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator — marks which roles are allowed to access a route.
 *
 * Usage:
 *   @Roles(Role.OWNER, Role.ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   deleteProject() { ... }
 *
 * RolesGuard reads this metadata and blocks users whose role isn't in the list.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
