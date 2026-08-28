import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService, type NotificationsServicePort } from './notifications.service';

@ApiTags('Notification preferences')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/notification-preferences', version: '1' })
export class NotificationPreferencesController {
  constructor(@Inject(NotificationsService) private readonly service: NotificationsServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiOkResponse()
  get(@CurrentUser() user: AuthUser) { return this.service.getPreferences(user.id); }

  @Put()
  @ApiOperation({ summary: 'Replace notification preferences' })
  @ApiOkResponse()
  replace(@CurrentUser() user: AuthUser, @Body() dto: UpdateNotificationPreferencesDto) { return this.service.replacePreferences(user.id, dto); }
}
