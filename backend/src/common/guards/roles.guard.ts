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
 * RolesGuard enforces Role-Based Access Control (RBAC).
 *
 * Important: RolesGuard must ALWAYS run AFTER JwtAuthGuard,
 * because it depends on request.user being populated by the JWT strategy.
 *
 * How it works:
 *  1. A route is decorated with @Roles(Role.OWNER, Role.ADMIN)
 *  2. RolesGuard reads those required roles from the route metadata
 *  3. It checks if the current user's role in the project satisfies the requirement
 *  4. If not, it throws a 403 Forbidden
 *
 * NOTE: For project-scoped roles (OWNER/ADMIN/MEMBER), the service layer
 * handles role checks using the ProjectMember record — this guard handles
 * simpler route-level role requirements.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the roles required for this route (set by @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Check method-level decorator first
      context.getClass(), // Then class-level decorator
    ]);

    // If no @Roles decorator is present, the route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if the user's role is in the list of required roles
    // Project-scoped role checking happens in service methods using ProjectMember
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
