import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { LeftoverBatchListResponseDto, LeftoverBatchResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { HouseholdAccessService } from '../households/household-access.service';
import { CreateLeftoverDto } from './dto/create-leftover.dto';
import { LeftoversService, LeftoversServicePort } from './leftovers.service';

@ApiTags('Leftovers') @ApiBearerAuth() @ApiInternalServerErrorResponse() @UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/leftovers', version: '1' })
export class LeftoversController {
  constructor(@Inject(LeftoversService) private readonly service: LeftoversServicePort) {}
  @Get() @ApiOperation({ summary: 'List available personal leftovers' }) @ApiOkResponse({ type: LeftoverBatchListResponseDto }) list(@CurrentUser() user: AuthUser) { return this.service.list(user.id); }
  @Post() @ApiOperation({ summary: 'Create a leftover batch from completed cooking history' }) @ApiCreatedResponse({ type: LeftoverBatchResponseDto }) create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeftoverDto) { return this.service.create(user.id, dto); }
}

@ApiTags('Household leftovers') @ApiBearerAuth() @ApiInternalServerErrorResponse() @UseGuards(JwtAuthGuard)
@Controller({ path: 'households/:householdId/leftovers', version: '1' })
export class HouseholdLeftoversController {
  constructor(@Inject(LeftoversService) private readonly service: LeftoversServicePort, private readonly access: HouseholdAccessService) {}
  @Get() @ApiOperation({ summary: 'List available household leftovers' }) @ApiOkResponse({ type: LeftoverBatchListResponseDto }) async list(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number) { await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER', 'VIEWER']); return this.service.list(user.id, householdId); }
  @Post() @ApiOperation({ summary: 'Create a household leftover batch from completed cooking history' }) @ApiCreatedResponse({ type: LeftoverBatchResponseDto }) async create(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateLeftoverDto) { await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']); return this.service.create(user.id, dto, householdId); }
}
