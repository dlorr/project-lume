import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import {
  getProjectMember,
  assertRole,
} from '../../common/helpers/project-access.helper';
import slugify from 'slugify';
import { Role } from 'src/generated/prisma/enums';

const DEFAULT_STATUSES = [
  { name: 'To Do', color: '#6B7280', order: 0, isDefault: true },
  { name: 'In Progress', color: '#3B82F6', order: 1, isDefault: false },
  { name: 'In Review', color: '#F59E0B', order: 2, isDefault: false },
  { name: 'Done', color: '#10B981', order: 3, isDefault: false },
];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const existingKey = await this.prisma.project.findUnique({
      where: { key: dto.key },
    });

    if (existingKey) {
      throw new ConflictException(`Project key "${dto.key}" is already in use`);
    }

    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name,
          slug,
          key: dto.key,
          description: dto.description,
        },
      });

      await tx.projectMember.create({
        data: {
          userId,
          projectId: project.id,
          role: Role.OWNER,
        },
      });

      await tx.board.create({
        data: {
          name: `${project.name} Board`,
          projectId: project.id,
          statuses: {
            create: DEFAULT_STATUSES,
          },
        },
      });

      return project;
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: {
              select: { members: true, tickets: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(({ role, joinedAt, project }) => ({
      ...project,
      myRole: role,
      joinedAt,
    }));
  }

  async findOne(projectId: string, userId: string) {
    await getProjectMember(this.prisma, projectId, userId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        board: {
          include: {
            statuses: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(member.role, Role.ADMIN);

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async archive(projectId: string, userId: string) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(
      member.role,
      Role.OWNER,
      'Only the project owner can archive this project',
    );

    return this.prisma.project.update({
      where: { id: projectId },
      data: { isArchived: true },
    });
  }

  async inviteMember(
    projectId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ) {
    const inviter = await getProjectMember(this.prisma, projectId, inviterId);
    assertRole(inviter.role, Role.ADMIN);

    const userToInvite = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException('No user found with that email address');
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: userToInvite.id,
          projectId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        userId: userToInvite.id,
        projectId,
        role: dto.role ?? Role.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async removeMember(
    projectId: string,
    requesterId: string,
    targetUserId: string,
  ) {
    const requester = await getProjectMember(
      this.prisma,
      projectId,
      requesterId,
    );
    assertRole(requester.role, Role.ADMIN);

    const target = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    });

    if (!target) {
      throw new NotFoundException('Member not found in this project');
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException('The project owner cannot be removed');
    }

    if (target.role === Role.ADMIN && requester.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can remove an admin');
    }

    await this.prisma.projectMember.delete({
      where: {
        userId_projectId: { userId: targetUserId, projectId },
      },
    });

    return { message: 'Member removed successfully' };
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++counter}`;
    }

    return slug;
  }
}
