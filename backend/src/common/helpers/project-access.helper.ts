import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';

/**
 * Fetches the ProjectMember record for a user in a project.
 *
 * This is the central RBAC helper for all project-scoped operations.
 * Instead of duplicating this lookup in every service method, we call
 * this helper once and get the member's role back.
 *
 * Throws NotFoundException if the project doesn't exist.
 * Throws ForbiddenException if the user is not a member.
 *
 * @returns The ProjectMember record (includes the user's role in this project)
 */
export async function getProjectMember(
  prisma: PrismaService,
  projectId: string,
  userId: string,
) {
  // First confirm the project exists at all
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // Then confirm the user is a member of it
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });

  if (!member) {
    throw new ForbiddenException('You are not a member of this project');
  }

  return member;
}

/**
 * Asserts that a user's role meets the minimum required role.
 *
 * Role hierarchy (highest to lowest): OWNER > ADMIN > MEMBER
 *
 * Usage:
 *   assertRole(member.role, Role.ADMIN)
 *   // throws ForbiddenException if member is just a MEMBER
 */
export function assertRole(
  userRole: Role,
  requiredRole: Role,
  message = 'You do not have permission to perform this action',
): void {
  const hierarchy: Record<Role, number> = {
    [Role.OWNER]: 3,
    [Role.ADMIN]: 2,
    [Role.MEMBER]: 1,
  };

  if (hierarchy[userRole] < hierarchy[requiredRole]) {
    throw new ForbiddenException(message);
  }
}
