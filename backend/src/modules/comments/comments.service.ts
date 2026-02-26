import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { getProjectMember } from '../../common/helpers/project-access.helper';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    projectId: string,
    ticketId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    await getProjectMember(this.prisma, projectId, userId);

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, projectId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.comment.create({
      data: {
        body: dto.body,
        ticketId,
        authorId: userId,
      },
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
    });
  }

  async update(
    projectId: string,
    ticketId: string,
    commentId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    await getProjectMember(this.prisma, projectId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, ticketId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body, isEdited: true },
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
    });
  }

  async remove(
    projectId: string,
    ticketId: string,
    commentId: string,
    userId: string,
  ) {
    const member = await getProjectMember(this.prisma, projectId, userId);

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, ticketId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const isAuthor = comment.authorId === userId;
    const isAdminOrOwner = ([Role.OWNER, Role.ADMIN] as Role[]).includes(
      member.role,
    );

    if (!isAuthor && !isAdminOrOwner) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted successfully' };
  }
}
