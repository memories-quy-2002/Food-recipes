import { Body, Controller, Get, Inject, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiErrorResponseDto } from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpsertJournalDto } from './dto/upsert-journal.dto';
import { JournalsService, JournalsServicePort } from './journals.service';

@ApiTags('Cooking journals')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/cooking-history/:historyId/journal', version: '1' })
export class JournalsController {
  constructor(@Inject(JournalsService) private readonly service: JournalsServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get a private journal entry for owned cooking history' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  get(@CurrentUser() user: AuthUser, @Param('historyId', ParseIntPipe) historyId: number) { return this.service.get(user.id, historyId); }

  @Put()
  @ApiOperation({ summary: 'Save a private cooking journal entry' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  upsert(@CurrentUser() user: AuthUser, @Param('historyId', ParseIntPipe) historyId: number, @Body() dto: UpsertJournalDto) { return this.service.upsert(user.id, historyId, dto); }
}
