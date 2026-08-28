import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { CreateHouseholdInviteDto } from './dto/create-household-invite.dto';
import { UpdateHouseholdMemberDto } from './dto/update-household-member.dto';
import { HouseholdsService } from './households.service';

@ApiTags('Households')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller()
export class HouseholdsController {
  constructor(@Inject(HouseholdsService) private readonly service: HouseholdsService) {}

  @Post('households')
  @ApiOperation({ summary: 'Create a household and become its owner' })
  @ApiCreatedResponse()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHouseholdDto) { return this.service.create(user.id, dto); }

  @Get('households')
  @ApiOperation({ summary: 'List households for the current user' })
  @ApiOkResponse()
  list(@CurrentUser() user: AuthUser) { return this.service.list(user.id); }

  @Get('households/:householdId')
  @ApiOperation({ summary: 'Get an accessible household and its members' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  get(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number) { return this.service.get(user.id, householdId); }

  @Post('households/:householdId/invites')
  @ApiOperation({ summary: 'Create a household invite' })
  @ApiCreatedResponse()
  createInvite(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Body() dto: CreateHouseholdInviteDto) { return this.service.createInvite(user.id, householdId, dto); }

  @Post('household-invites/:token/accept')
  @ApiOperation({ summary: 'Accept a household invite' })
  @ApiOkResponse()
  acceptInvite(@CurrentUser() user: AuthUser, @Param('token') token: string) { return this.service.acceptInvite(user.id, user.email, token); }

  @Patch('households/:householdId/members/:memberId')
  @ApiOperation({ summary: 'Update a household member role' })
  @ApiOkResponse()
  updateMember(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: UpdateHouseholdMemberDto) { return this.service.updateMember(user.id, householdId, memberId, dto); }

  @Delete('households/:householdId/members/:memberId')
  @ApiOperation({ summary: 'Remove a household member' })
  @ApiOkResponse()
  removeMember(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('memberId', ParseIntPipe) memberId: number) { return this.service.removeMember(user.id, householdId, memberId); }
}
