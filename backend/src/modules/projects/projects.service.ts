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

/**
 * Default Kanban statuses created with every new project.
 * These give users an immediate working board without manual setup.
 * Order values determine left-to-right column position on the board.
 */
const DEFAULT_STATUSES = [
  { name: 'To Do', color: '#6B7280', order: 0, isDefault: true },
  { name: 'In Progress', color: '#3B82F6', order: 1, isDefault: false },
  { name: 'In Review', color: '#F59E0B', order: 2, isDefault: false },
  { name: 'Done', color: '#10B981', order: 3, isDefault: false },
];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new project.
   *
   * We use a Prisma transaction here because creating a project involves
   * multiple DB writes that must all succeed or all fail together:
   *   1. Create the project
   *   2. Add the creator as OWNER
   *   3. Create the default board
   *   4. Create default statuses on the board
   *
   * If step 3 fails, we don't want a project with no board sitting in the DB.
   * Transactions give us atomicity — all or nothing.
   */
  async create(userId: string, dto: CreateProjectDto) {
    // Check if project key is already taken globally
    const existingKey = await this.prisma.project.findUnique({
      where: { key: dto.key },
    });

    if (existingKey) {
      throw new ConflictException(`Project key "${dto.key}" is already in use`);
    }

    // Generate a URL-friendly slug from the project name
    // e.g. "My Awesome Project" → "my-awesome-project"
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    return this.prisma.$transaction(async (tx) => {
      // Step 1: Create the project
      const project = await tx.project.create({
        data: {
          name: dto.name,
          slug,
          key: dto.key,
          description: dto.description,
        },
      });

      // Step 2: Add creator as OWNER
      await tx.projectMember.create({
        data: {
          userId,
          projectId: project.id,
          role: Role.OWNER,
        },
      });

      // Step 3 + 4: Create board with default statuses in one nested write
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

  /**
   * Get all projects the current user is a member of.
   * Includes the user's role in each project.
   */
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

    // Reshape so the response is project-centric, not membership-centric
    return memberships.map(({ role, joinedAt, project }) => ({
      ...project,
      myRole: role,
      joinedAt,
    }));
  }

  /**
   * Get a single project by ID.
   * User must be a member to view it.
   */
  async findOne(projectId: string, userId: string) {
    // This confirms both project existence and user membership
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

  /**
   * Update project name or description.
   * Requires ADMIN or OWNER role.
   */
  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(member.role, Role.ADMIN);

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  /**
   * Soft-delete: archive a project instead of deleting it.
   * Archived projects are hidden from listings but data is preserved.
   * Only OWNER can archive — this is a destructive enough action.
   */
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

  /**
   * Invite a user to the project by their email address.
   * Requires ADMIN or OWNER role.
   */
  async inviteMember(
    projectId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ) {
    const inviter = await getProjectMember(this.prisma, projectId, inviterId);
    assertRole(inviter.role, Role.ADMIN);

    // Find the user to invite
    const userToInvite = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException('No user found with that email address');
    }

    // Check if already a member
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

  /**
   * Remove a member from the project.
   * OWNER can remove anyone. ADMIN can remove MEMBERs only.
   * Nobody can remove the OWNER (ownership transfer is a future feature).
   */
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

    // OWNER cannot be removed
    if (target.role === Role.OWNER) {
      throw new ForbiddenException('The project owner cannot be removed');
    }

    // ADMIN cannot remove other ADMINs — only OWNER can
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

  // ─────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────

  /**
   * Generate a unique slug by appending a counter if the base slug is taken.
   * e.g. "my-project" → "my-project-2" → "my-project-3"
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++counter}`;
    }

    return slug;
  }
}
