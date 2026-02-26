import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getProjectMember } from '../../common/helpers/project-access.helper';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBoardForProject(projectId: string, userId: string) {
    await getProjectMember(this.prisma, projectId, userId);

    return this.prisma.board.findUnique({
      where: { projectId },
      include: {
        statuses: {
          orderBy: { order: 'asc' },
          include: {
            tickets: {
              orderBy: { order: 'asc' },
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
                  select: { comments: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
