import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AddCollectionRecipeDto } from './dto/add-collection-recipe.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionsService, CollectionsServicePort } from './collections.service';
import { ApiErrorResponseDto, CollectionResponseDto, CollectionsResponseDto, MessageResponseDto } from '../../common/swagger/response.schemas';

@ApiTags('Collections')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/collections', version: '1' })
export class CollectionsController {
  constructor(@Inject(CollectionsService) private readonly service: CollectionsServicePort) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user collections' })
  @ApiOkResponse({ type: CollectionsResponseDto })
  list(@CurrentUser() user: AuthUser) { return this.service.list(user.id); }

  @Post()
  @ApiOperation({ summary: 'Create a private recipe collection' })
  @ApiCreatedResponse({ type: CollectionResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCollectionDto) { return this.service.create(user.id, dto); }

  @Patch(':collectionId')
  @ApiOperation({ summary: 'Rename an owned collection' })
  @ApiOkResponse({ type: CollectionResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@CurrentUser() user: AuthUser, @Param('collectionId', ParseIntPipe) collectionId: number, @Body() dto: UpdateCollectionDto) { return this.service.update(user.id, collectionId, dto); }

  @Delete(':collectionId')
  @ApiOperation({ summary: 'Delete an owned collection' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  remove(@CurrentUser() user: AuthUser, @Param('collectionId', ParseIntPipe) collectionId: number) { return this.service.remove(user.id, collectionId); }

  @Post(':collectionId/recipes')
  @ApiOperation({ summary: 'Add a recipe to an owned collection' })
  @ApiCreatedResponse({ type: CollectionResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  addRecipe(@CurrentUser() user: AuthUser, @Param('collectionId', ParseIntPipe) collectionId: number, @Body() dto: AddCollectionRecipeDto) { return this.service.addRecipe(user.id, collectionId, dto); }

  @Delete(':collectionId/recipes/:recipeId')
  @ApiOperation({ summary: 'Remove a recipe from an owned collection' })
  @ApiOkResponse({ type: MessageResponseDto })
  removeRecipe(@CurrentUser() user: AuthUser, @Param('collectionId', ParseIntPipe) collectionId: number, @Param('recipeId', ParseIntPipe) recipeId: number) { return this.service.removeRecipe(user.id, collectionId, recipeId); }
}
