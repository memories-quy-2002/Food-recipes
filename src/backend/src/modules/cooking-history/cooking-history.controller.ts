import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto, CookingHistoryItemResponseDto, CookingHistoryResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateCookingHistoryDto } from './dto/create-cooking-history.dto';
import { CookingHistoryService, CookingHistoryServicePort } from './cooking-history.service';

@ApiTags('Cooking history')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/cooking-history', version: '1' })
export class CookingHistoryController {
  constructor(@Inject(CookingHistoryService) private readonly service: CookingHistoryServicePort) {}

  @Get()
  @ApiOperation({ summary: 'List completed cooking sessions for the authenticated user' })
  @ApiOkResponse({ type: CookingHistoryResponseDto })
  list(@CurrentUser() user: AuthUser) { return this.service.list(user.id); }

  @Post()
  @ApiOperation({ summary: 'Record a completed cooking session' })
  @ApiCreatedResponse({ type: CookingHistoryItemResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCookingHistoryDto) { return this.service.create(user.id, dto); }
}
