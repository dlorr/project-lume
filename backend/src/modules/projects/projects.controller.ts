import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'projects', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':projectId')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(projectId, user.id);
  }

  @Patch(':projectId')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, user.id, dto);
  }

  @Patch(':projectId/archive')
  archive(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.archive(projectId, user.id);
  }

  @Post(':projectId/members')
  inviteMember(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.projectsService.inviteMember(projectId, user.id, dto);
  }

  @Delete(':projectId/members/:userId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.projectsService.removeMember(projectId, user.id, targetUserId);
  }
}
