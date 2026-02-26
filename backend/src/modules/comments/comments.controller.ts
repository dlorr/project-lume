import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'projects', version: '1' })
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':projectId/tickets/:ticketId/comments')
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(projectId, ticketId, user.id, dto);
  }

  @Patch(':projectId/tickets/:ticketId/comments/:commentId')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.update(
      projectId,
      ticketId,
      commentId,
      user.id,
      dto,
    );
  }

  @Delete(':projectId/tickets/:ticketId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(projectId, ticketId, commentId, user.id);
  }
}
