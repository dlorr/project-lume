import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';

export async function getProjectMember(
  prisma: PrismaService,
  projectId: string,
  userId: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

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
