import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — reserved for FUTURE system-level role checks.
 *
 * NOT currently used in this application.
 *
 * Our RBAC is fully project-scoped — meaning a user's role (OWNER/ADMIN/MEMBER)
 * only exists within the context of a specific project, stored in ProjectMember.
 * This project-scoped check is handled by project-access.helper.ts instead.
 *
 * This guard would be useful if we add system-wide roles in the future,
 * for example a global "SUPER_ADMIN" role for a platform admin dashboard.
 *
 * Usage (when needed):
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('SUPER_ADMIN')
 *   @Get('admin/dashboard')
 *   getAdminDashboard() {}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
