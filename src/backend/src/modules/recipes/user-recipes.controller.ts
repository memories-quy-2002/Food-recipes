import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { RecipesService } from './recipes.service';
import { CreateRecipeDraftDto } from './dto/create-recipe-draft.dto';
import { RecipeStatusQueryDto } from './dto/recipe-structure.dto';
import { ApiErrorResponseDto, RecipeDetailResponseDto, RecipeListResponseDto } from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';

@ApiTags('Recipes')
@ApiInternalServerErrorResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/recipes', version: '1' })
export class UserRecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List recipes created by the authenticated user' })
  @ApiOkResponse({ description: 'Recipes owned by the authenticated user', type: RecipeListResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  listMine(@CurrentUser() user: AuthUser, @Query() query: RecipeStatusQueryDto) {
    return this.recipesService.listMine(user.id, query.status ?? 'all');
  }

  @Post('drafts')
  @ApiOperation({ summary: 'Create a draft recipe for the authenticated user' })
  @ApiOkResponse({ description: 'Draft created', type: RecipeDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Draft input is invalid', type: ApiErrorResponseDto })
  createDraft(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeDraftDto) {
    return this.recipesService.createDraft(user.id, dto);
  }
}
