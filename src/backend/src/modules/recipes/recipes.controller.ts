import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  ReplaceRecipeIngredientsDto,
  ReplaceRecipeNutritionDto,
  ReplaceRecipeTagsDto,
} from './dto/recipe-structure.dto';
import { CreateRecipeDraftDto } from './dto/create-recipe-draft.dto';
import { RecipesService } from './recipes.service';
import {
  ApiErrorResponseDto,
  RecipeDetailResponseDto,
  PaginatedRecipeListResponseDto,
} from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';

@ApiTags('Recipes')
@ApiInternalServerErrorResponse()
@Controller({ path: 'recipes', version: '1' })
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List recipes' })
  @ApiBadRequestResponse({ description: 'Recipe query is invalid', type: ApiErrorResponseDto })
  @ApiOkResponse({ description: 'Recipes matching the filters', type: PaginatedRecipeListResponseDto })
  list(@Query() query: RecipeQueryDto) {
    return this.recipesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe' })
  @ApiParam({ name: 'id', type: Number, description: 'Recipe identifier' })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiOkResponse({ description: 'Recipe details', type: RecipeDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe was not found', type: ApiErrorResponseDto })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a recipe' })
  @ApiCreatedResponse({ description: 'Recipe created', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe input is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  @Put(':id/ingredients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace structured ingredients for an owned recipe' })
  @ApiOkResponse({ description: 'Structured ingredients replaced', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Ingredient input is invalid', type: ApiErrorResponseDto })
  replaceIngredients(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReplaceRecipeIngredientsDto,
  ) {
    return this.recipesService.replaceIngredients(id, user.id, dto);
  }

  @Put(':id/nutrition')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace manual nutrition for an owned recipe' })
  @ApiOkResponse({ description: 'Nutrition replaced', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Nutrition input is invalid', type: ApiErrorResponseDto })
  replaceNutrition(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReplaceRecipeNutritionDto,
  ) {
    return this.recipesService.replaceNutrition(id, user.id, dto);
  }

  @Put(':id/dietary-tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace dietary and allergen tags for an owned recipe' })
  @ApiOkResponse({ description: 'Recipe tags replaced', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Tag input is invalid', type: ApiErrorResponseDto })
  replaceTags(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReplaceRecipeTagsDto,
  ) {
    return this.recipesService.replaceTags(id, user.id, dto);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an owned draft recipe' })
  @ApiOkResponse({ description: 'Recipe published', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe is not ready to publish', type: ApiErrorResponseDto })
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.recipesService.publish(id, user.id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive an owned published recipe' })
  @ApiOkResponse({ description: 'Recipe archived', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe cannot be archived in its current state', type: ApiErrorResponseDto })
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.recipesService.archive(id, user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore an owned archived recipe to draft' })
  @ApiOkResponse({ description: 'Recipe restored as draft', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe cannot be restored in its current state', type: ApiErrorResponseDto })
  restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.recipesService.restore(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an owned recipe' })
  @ApiParam({ name: 'id', type: Number, description: 'Recipe identifier' })
  @ApiOkResponse({ description: 'Recipe updated', type: RecipeDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe input is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Recipe belongs to another user', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe was not found', type: ApiErrorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned recipe' })
  @ApiParam({ name: 'id', type: Number, description: 'Recipe identifier' })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiNoContentResponse({ description: 'Recipe deleted' })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Recipe belongs to another user', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe was not found', type: ApiErrorResponseDto })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.recipesService.delete(id, user.id);
  }
}
