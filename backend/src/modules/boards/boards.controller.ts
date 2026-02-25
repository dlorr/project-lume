import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'projects', version: '1' })
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  /** GET /api/v1/projects/:projectId/board */
  @Get(':projectId/board')
  getBoard(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.boardsService.getBoardForProject(projectId, user.id);
  }
}
