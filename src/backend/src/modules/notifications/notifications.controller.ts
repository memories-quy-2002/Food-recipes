import { Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationsService, type NotificationsServicePort } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/notifications', version: '1' })
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly service: NotificationsServicePort,
    private readonly rules: NotificationRulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  @ApiOkResponse()
  async list(@CurrentUser() user: AuthUser) {
    await this.rules.generateForUser(user.id);
    return this.service.list(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiOkResponse()
  markRead(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.service.markRead(user.id, id); }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse()
  markAllRead(@CurrentUser() user: AuthUser) { return this.service.markAllRead(user.id); }
}
