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
import { RecipesService } from './recipes.service';
import {
  ApiErrorResponseDto,
  RecipeDetailResponseDto,
  RecipeListResponseDto,
} from '../../common/swagger/response.schemas';

@ApiTags('Recipes')
@Controller({ path: 'recipes', version: '1' })
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List recipes' })
  @ApiBadRequestResponse({ description: 'Recipe query is invalid', type: ApiErrorResponseDto })
  @ApiOkResponse({ description: 'Recipes matching the filters', type: RecipeListResponseDto })
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
