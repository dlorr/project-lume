import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getProjectMember } from '../../common/helpers/project-access.helper';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the full Kanban board for a project.
   *
   * Returns the board with all statuses (columns), each containing
   * their tickets in order, with assignee info attached.
   *
   * This is the primary query that powers the Kanban board view —
   * the frontend renders this response directly as columns + cards.
   */
  async getBoardForProject(projectId: string, userId: string) {
    // Confirm user is a project member before returning board data
    await getProjectMember(this.prisma, projectId, userId);

    return this.prisma.board.findUnique({
      where: { projectId },
      include: {
        statuses: {
          orderBy: { order: 'asc' }, // Columns left to right
          include: {
            tickets: {
              orderBy: { order: 'asc' }, // Cards top to bottom within column
              include: {
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
                _count: {
                  select: { comments: true }, // Comment count badge on card
                },
              },
            },
          },
        },
      },
    });
  }
}
