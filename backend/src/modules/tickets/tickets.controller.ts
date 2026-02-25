import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { MoveTicketDto } from './dto/move-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller({ path: 'projects', version: '1' })
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** POST /api/v1/projects/:projectId/tickets */
  @Post(':projectId/tickets')
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(projectId, user.id, dto);
  }

  /**
   * GET /api/v1/projects/:projectId/tickets
   * Supports query filters: ?statusId=&assigneeId=&priority=&type=
   */
  @Get(':projectId/tickets')
  findAll(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('statusId') statusId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
  ) {
    return this.ticketsService.findAll(projectId, user.id, {
      statusId,
      assigneeId,
      priority,
      type,
    });
  }

  /** GET /api/v1/projects/:projectId/tickets/:ticketId */
  @Get(':projectId/tickets/:ticketId')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.findOne(projectId, ticketId, user.id);
  }

  /** PATCH /api/v1/projects/:projectId/tickets/:ticketId */
  @Patch(':projectId/tickets/:ticketId')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(projectId, ticketId, user.id, dto);
  }

  /** PATCH /api/v1/projects/:projectId/tickets/:ticketId/move */
  @Patch(':projectId/tickets/:ticketId/move')
  move(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: MoveTicketDto,
  ) {
    return this.ticketsService.move(projectId, ticketId, user.id, dto);
  }

  /** DELETE /api/v1/projects/:projectId/tickets/:ticketId */
  @Delete(':projectId/tickets/:ticketId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.remove(projectId, ticketId, user.id);
  }
}
