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

  /**
   * Create a new ticket in a project.
   *
   * We use a transaction because ticket creation involves:
   *   1. Generating the next ticket number for the project (race condition risk)
   *   2. Creating the ticket
   *
   * Without a transaction, two simultaneous creates could get the same number.
   * With a transaction + DB-level unique constraint ([projectId, number]),
   * one of them will fail and retry — guaranteed uniqueness.
   */
  async create(projectId: string, userId: string, dto: CreateTicketDto) {
    await getProjectMember(this.prisma, projectId, userId);

    // Validate the status belongs to this project
    await this.validateStatusInProject(dto.statusId, projectId);

    return this.prisma.$transaction(async (tx) => {
      // Get the highest ticket number in this project and increment it
      // This gives us scoped sequential IDs: MYP-1, MYP-2, MYP-3...
      const lastTicket = await tx.ticket.findFirst({
        where: { projectId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });

      const nextNumber = (lastTicket?.number ?? 0) + 1;

      // Get current highest order in the target column to append at bottom
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

  /**
   * Get all tickets for a project with basic filtering support.
   */
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

  /**
   * Get a single ticket with full details including comments.
   */
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

  /**
   * Update ticket fields.
   * Any project member can update tickets.
   */
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

  /**
   * Move a ticket to a different column and/or position.
   *
   * This is the drag-and-drop handler. When a card is dragged:
   *   1. We update the ticket's statusId (column) and order (position)
   *   2. We shift other tickets in the target column to make room
   *
   * We use a transaction to ensure the reordering is atomic —
   * no intermediate state where two tickets have the same order.
   */
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

      // Shift tickets in the target column at and after the target order up by 1
      // to make room for the moved ticket at the desired position
      await tx.ticket.updateMany({
        where: {
          statusId: dto.statusId,
          order: { gte: dto.order },
          id: { not: ticketId }, // Don't shift the ticket we're moving
        },
        data: { order: { increment: 1 } },
      });

      // Place the ticket in its new home
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

  /**
   * Delete a ticket.
   * Only OWNER, ADMIN, or the ticket's reporter can delete.
   */
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

  // ─────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────

  /**
   * Validates that a status belongs to the given project's board.
   * Prevents cross-project contamination — a user cannot assign a ticket
   * to a status column from a different project.
   */
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
