import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  getProjectMember,
  assertRole,
} from '../../common/helpers/project-access.helper';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class StatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateStatusDto) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(member.role, Role.ADMIN);

    const board = await this.prisma.board.findUnique({ where: { projectId } });
    if (!board) throw new NotFoundException('Board not found');

    const existing = await this.prisma.status.findUnique({
      where: { boardId_name: { boardId: board.id, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(
        `Status "${dto.name}" already exists on this board`,
      );
    }

    if (dto.isDefault) {
      await this.prisma.status.updateMany({
        where: { boardId: board.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.status.create({
      data: {
        name: dto.name,
        color: dto.color,
        order: dto.order,
        isDefault: dto.isDefault ?? false,
        boardId: board.id,
      },
    });
  }

  async update(
    projectId: string,
    statusId: string,
    userId: string,
    dto: UpdateStatusDto,
  ) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(member.role, Role.ADMIN);

    const status = await this.findStatusInProject(projectId, statusId);

    if (dto.isDefault) {
      await this.prisma.status.updateMany({
        where: { boardId: status.boardId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.status.update({
      where: { id: statusId },
      data: dto,
    });
  }

  async remove(projectId: string, statusId: string, userId: string) {
    const member = await getProjectMember(this.prisma, projectId, userId);
    assertRole(member.role, Role.ADMIN);

    const status = await this.findStatusInProject(projectId, statusId);

    const ticketCount = await this.prisma.ticket.count({
      where: { statusId },
    });

    if (ticketCount > 0) {
      throw new BadRequestException(
        `Cannot delete a column that contains ${ticketCount} ticket(s). Move them first.`,
      );
    }

    await this.prisma.status.delete({ where: { id: statusId } });

    return { message: 'Status deleted successfully' };
  }

  private async findStatusInProject(projectId: string, statusId: string) {
    const board = await this.prisma.board.findUnique({ where: { projectId } });
    if (!board) throw new NotFoundException('Board not found');

    const status = await this.prisma.status.findFirst({
      where: { id: statusId, boardId: board.id },
    });

    if (!status) {
      throw new NotFoundException('Status not found in this project');
    }

    return status;
  }
}
