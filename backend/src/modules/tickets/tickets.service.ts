import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { MoveTicketDto } from './dto/move-ticket.dto';
import {
  getProjectMember,
  assertRole,
} from '../../common/helpers/project-access.helper';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateTicketDto) {
    await getProjectMember(this.prisma, projectId, userId);

    await this.validateStatusInProject(dto.statusId, projectId);

    return this.prisma.$transaction(async (tx) => {
      const lastTicket = await tx.ticket.findFirst({
        where: { projectId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });

      const nextNumber = (lastTicket?.number ?? 0) + 1;

      const lastInColumn = await tx.ticket.findFirst({
        where: { statusId: dto.statusId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const order = (lastInColumn?.order ?? -1) + 1;

      return tx.ticket.create({
        data: {
          title: dto.title,
          description: dto.description,
          type: dto.type,
          priority: dto.priority,
          statusId: dto.statusId,
          assigneeId: dto.assigneeId,
          reporterId: userId,
          projectId,
          number: nextNumber,
          order,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
        include: {
          status: true,
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          reporter: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  }

  async findAll(
    projectId: string,
    userId: string,
    filters: {
      statusId?: string;
      assigneeId?: string;
      priority?: string;
      type?: string;
    },
  ) {
    await getProjectMember(this.prisma, projectId, userId);

    return this.prisma.ticket.findMany({
      where: {
        projectId,
        ...(filters.statusId && { statusId: filters.statusId }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
        ...(filters.priority && { priority: filters.priority as any }),
        ...(filters.type && { type: filters.type as any }),
      },
      include: {
        status: true,
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ statusId: 'asc' }, { order: 'asc' }],
    });
  }

  async findOne(projectId: string, ticketId: string, userId: string) {
    await getProjectMember(this.prisma, projectId, userId);

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, projectId },
      include: {
        status: true,
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return ticket;
  }

  async update(
    projectId: string,
    ticketId: string,
    userId: string,
    dto: UpdateTicketDto,
  ) {
    await getProjectMember(this.prisma, projectId, userId);

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, projectId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        status: true,
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async move(
    projectId: string,
    ticketId: string,
    userId: string,
    dto: MoveTicketDto,
  ) {
    await getProjectMember(this.prisma, projectId, userId);
    await this.validateStatusInProject(dto.statusId, projectId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirst({
        where: { id: ticketId, projectId },
      });

      if (!ticket) throw new NotFoundException('Ticket not found');

      await tx.ticket.updateMany({
        where: {
          statusId: dto.statusId,
          order: { gte: dto.order },
          id: { not: ticketId },
        },
        data: { order: { increment: 1 } },
      });

      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          statusId: dto.statusId,
          order: dto.order,
        },
        include: { status: true },
      });
    });
  }

  async remove(projectId: string, ticketId: string, userId: string) {
    const member = await getProjectMember(this.prisma, projectId, userId);

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, projectId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const isReporter = ticket.reporterId === userId;
    const isAdminOrOwner = ([Role.OWNER, Role.ADMIN] as Role[]).includes(
      member.role,
    );

    if (!isReporter && !isAdminOrOwner) {
      throw new ForbiddenException(
        'Only the reporter, admin, or owner can delete this ticket',
      );
    }

    await this.prisma.ticket.delete({ where: { id: ticketId } });

    return { message: 'Ticket deleted successfully' };
  }

  private async validateStatusInProject(statusId: string, projectId: string) {
    const board = await this.prisma.board.findUnique({ where: { projectId } });
    if (!board) throw new NotFoundException('Board not found');

    const status = await this.prisma.status.findFirst({
      where: { id: statusId, boardId: board.id },
    });

    if (!status) {
      throw new BadRequestException('Status does not belong to this project');
    }

    return status;
  }
}
