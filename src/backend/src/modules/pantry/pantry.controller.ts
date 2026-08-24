import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto, MessageResponseDto, PantryItemResponseDto, PantryResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryService, PantryServicePort } from './pantry.service';

@ApiTags('Pantry')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/pantry', version: '1' })
export class PantryController {
  constructor(@Inject(PantryService) private readonly service: PantryServicePort) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user pantry' })
  @ApiOkResponse({ type: PantryResponseDto })
  list(@CurrentUser() user: AuthUser) { return this.service.list(user.id); }

  @Post()
  @ApiOperation({ summary: 'Add an item to the authenticated user pantry' })
  @ApiCreatedResponse({ type: PantryItemResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePantryItemDto) { return this.service.create(user.id, dto); }

  @Patch(':pantryId')
  @ApiOperation({ summary: 'Update an owned pantry item' })
  @ApiOkResponse({ type: PantryItemResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@CurrentUser() user: AuthUser, @Param('pantryId', ParseIntPipe) pantryId: number, @Body() dto: UpdatePantryItemDto) { return this.service.update(user.id, pantryId, dto); }

  @Delete(':pantryId')
  @ApiOperation({ summary: 'Delete an owned pantry item' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  remove(@CurrentUser() user: AuthUser, @Param('pantryId', ParseIntPipe) pantryId: number) { return this.service.remove(user.id, pantryId); }
}
