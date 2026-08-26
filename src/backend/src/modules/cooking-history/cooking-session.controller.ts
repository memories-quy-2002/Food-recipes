import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import {
  ApiErrorResponseDto,
  CookingSessionCompletionResponseDto,
  CookingSessionResponseDto,
  MessageResponseDto,
} from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { ActiveCookingSessionQueryDto } from './dto/active-cooking-session-query.dto';
import { StartCookingSessionDto } from './dto/start-cooking-session.dto';
import { UpdateCookingSessionDto } from './dto/update-cooking-session.dto';
import { CookingSessionService, CookingSessionServicePort } from './cooking-session.service';

@ApiTags('Cooking sessions')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/cooking-session', version: '1' })
export class CookingSessionController {
  constructor(@Inject(CookingSessionService) private readonly service: CookingSessionServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user active cooking session' })
  @ApiOkResponse({ type: CookingSessionResponseDto })
  getActive(@CurrentUser() user: AuthUser, @Query() query: ActiveCookingSessionQueryDto) {
    return this.service.getActive(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Start or resume a cooking session' })
  @ApiCreatedResponse({ type: CookingSessionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  start(@CurrentUser() user: AuthUser, @Body() dto: StartCookingSessionDto) {
    return this.service.start(user.id, dto);
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Save cooking progress or pause a cooking session' })
  @ApiOkResponse({ type: CookingSessionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: UpdateCookingSessionDto,
  ) {
    return this.service.update(user.id, sessionId, dto);
  }

  @Post(':sessionId/complete')
  @ApiOperation({ summary: 'Complete a cooking session and write cooking history' })
  @ApiOkResponse({ type: CookingSessionCompletionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  complete(@CurrentUser() user: AuthUser, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.service.complete(user.id, sessionId);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Abandon an active cooking session' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  abandon(@CurrentUser() user: AuthUser, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.service.abandon(user.id, sessionId);
  }
}
