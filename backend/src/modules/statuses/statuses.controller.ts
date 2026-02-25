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
import { StatusesService } from './statuses.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'projects', version: '1' })
@UseGuards(JwtAuthGuard)
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  /** POST /api/v1/projects/:projectId/statuses */
  @Post(':projectId/statuses')
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateStatusDto,
  ) {
    return this.statusesService.create(projectId, user.id, dto);
  }

  /** PATCH /api/v1/projects/:projectId/statuses/:statusId */
  @Patch(':projectId/statuses/:statusId')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.statusesService.update(projectId, statusId, user.id, dto);
  }

  /** DELETE /api/v1/projects/:projectId/statuses/:statusId */
  @Delete(':projectId/statuses/:statusId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
  ) {
    return this.statusesService.remove(projectId, statusId, user.id);
  }
}
