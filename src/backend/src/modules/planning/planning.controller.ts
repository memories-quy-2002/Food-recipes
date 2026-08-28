import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto, MealPlanItemResponseDto, MealPlanResponseDto, MessageResponseDto, PrepareRecipeResponseDto, ShoppingListItemResponseDto, ShoppingListResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { HouseholdAccessService } from '../households/household-access.service';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
import { AddShoppingListItemDto } from './dto/add-shopping-list-item.dto';
import { DateRangeDto } from './dto/date-range.dto';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto';
import { PrepareRecipeIngredientsDto } from './dto/prepare-recipe-ingredients.dto';
import { UpdateMealPlanItemDto } from './dto/update-meal-plan-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { AddRecipeIngredientsDto } from './dto/add-recipe-ingredients.dto';
import { FromMealPlanPreviewDto, GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { MealPlanGeneratorService } from './meal-plan-generator.service';
import { PlanningService } from './planning.service';

@ApiTags('Planning')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me', version: '1' })
export class PlanningController {
  constructor(
    @Inject(PlanningService) private readonly service: PlanningService,
    @Inject(MealPlanGeneratorService) private readonly generator: MealPlanGeneratorService,
  ) {}

  @Post('meal-plans/generate-preview')
  @ApiOperation({ summary: 'Generate a non-persisted personalized meal plan preview' })
  generateMealPlanPreview(@CurrentUser() user: AuthUser, @Body() dto: GenerateMealPlanDto) {
    return this.generator.generatePreview(user.id, dto);
  }

  @Post('meal-plans/from-preview')
  @ApiOperation({ summary: 'Persist a previously generated meal plan preview after revalidation' })
  createMealPlanFromPreview(@CurrentUser() user: AuthUser, @Body() dto: FromMealPlanPreviewDto) {
    return this.generator.createFromPreview(user.id, dto);
  }

  @Get('meal-plans')
  @ApiOperation({ summary: 'List owned meal plans' })
  @ApiOkResponse({ type: MealPlanResponseDto, isArray: true })
  listPlans(@CurrentUser() user: AuthUser, @Query() query: MealPlanQueryDto) { return this.service.listPlans(user.id, query); }

  @Post('meal-plans')
  @ApiOperation({ summary: 'Create a meal plan' })
  @ApiCreatedResponse({ type: MealPlanResponseDto })
  createPlan(@CurrentUser() user: AuthUser, @Body() dto: DateRangeDto) { return this.service.createPlan(user.id, dto); }

  @Get('meal-plans/:planId')
  @ApiOperation({ summary: 'Get an owned meal plan with items' })
  @ApiOkResponse({ type: MealPlanResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getPlan(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number) { return this.service.getPlan(user.id, planId); }

  @Patch('meal-plans/:planId')
  @ApiOperation({ summary: 'Update an owned meal plan' })
  updatePlan(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number, @Body() dto: DateRangeDto) { return this.service.updatePlan(user.id, planId, dto); }

  @Delete('meal-plans/:planId')
  @ApiOperation({ summary: 'Delete an owned meal plan' })
  @ApiOkResponse({ type: MessageResponseDto })
  deletePlan(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number) { return this.service.deletePlan(user.id, planId); }

  @Post('meal-plans/:planId/items')
  @ApiOperation({ summary: 'Add a recipe to an owned meal plan' })
  @ApiCreatedResponse({ type: MealPlanItemResponseDto })
  addPlanItem(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number, @Body() dto: AddMealPlanItemDto) { return this.service.addPlanItem(user.id, planId, dto); }

  @Patch('meal-plans/:planId/items/:itemId')
  @ApiOperation({ summary: 'Update a meal plan item' })
  updatePlanItem(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number, @Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateMealPlanItemDto) { return this.service.updatePlanItem(user.id, planId, itemId, dto); }

  @Delete('meal-plans/:planId/items/:itemId')
  @ApiOperation({ summary: 'Delete a meal plan item' })
  @ApiOkResponse({ type: MessageResponseDto })
  deletePlanItem(@CurrentUser() user: AuthUser, @Param('planId', ParseIntPipe) planId: number, @Param('itemId', ParseIntPipe) itemId: number) { return this.service.deletePlanItem(user.id, planId, itemId); }

  @Get('shopping-list')
  @ApiOperation({ summary: 'List the owned shopping list' })
  @ApiOkResponse({ type: ShoppingListResponseDto })
  listShoppingList(@CurrentUser() user: AuthUser) { return this.service.listShoppingList(user.id); }

  @Post('shopping-list/items')
  @ApiOperation({ summary: 'Add a manual shopping list item' })
  @ApiCreatedResponse({ type: ShoppingListItemResponseDto })
  addShoppingItem(@CurrentUser() user: AuthUser, @Body() dto: AddShoppingListItemDto) { return this.service.addShoppingItem(user.id, dto); }

  @Patch('shopping-list/items/:itemId')
  @ApiOperation({ summary: 'Update a shopping list item' })
  updateShoppingItem(@CurrentUser() user: AuthUser, @Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateShoppingListItemDto) { return this.service.updateShoppingItem(user.id, itemId, dto); }

  @Delete('shopping-list/items/:itemId')
  @ApiOperation({ summary: 'Delete a shopping list item' })
  deleteShoppingItem(@CurrentUser() user: AuthUser, @Param('itemId', ParseIntPipe) itemId: number) { return this.service.deleteShoppingItem(user.id, itemId); }

  @Post('shopping-list/from-recipe')
  @ApiOperation({ summary: 'Copy recipe ingredients as separate shopping list lines' })
  addRecipeIngredients(@CurrentUser() user: AuthUser, @Body() dto: AddRecipeIngredientsDto) {
    return dto.recipeIds?.length
      ? this.service.addRecipeIngredientsFromRecipes(user.id, dto.recipeIds)
      : this.service.addRecipeIngredients(user.id, dto.recipeId!);
  }

  @Post('shopping-list/prepare')
  @ApiOperation({ summary: 'Compare a recipe with the owned pantry and add missing ingredients' })
  @ApiOkResponse({ type: PrepareRecipeResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  prepareRecipe(@CurrentUser() user: AuthUser, @Body() dto: PrepareRecipeIngredientsDto) {
    return this.service.prepareRecipeIngredients(user.id, dto.recipeId, dto.servings);
  }

  @Delete('shopping-list/completed')
  @ApiOperation({ summary: 'Clear completed shopping list items' })
  clearCompleted(@CurrentUser() user: AuthUser) { return this.service.clearCompletedShoppingItems(user.id); }
}

@ApiTags('Household Planning')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'households/:householdId', version: '1' })
export class HouseholdPlanningController {
  constructor(
    @Inject(PlanningService) private readonly service: PlanningService,
    private readonly access: HouseholdAccessService,
  ) {}

  @Get('meal-plans')
  @ApiOperation({ summary: 'List household meal plans' })
  @ApiOkResponse({ type: MealPlanResponseDto, isArray: true })
  async listPlans(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Query() query: MealPlanQueryDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER', 'VIEWER']);
    return this.service.listPlansForHousehold(householdId, query);
  }

  @Post('meal-plans')
  @ApiOperation({ summary: 'Create a household meal plan' })
  @ApiCreatedResponse({ type: MealPlanResponseDto })
  async createPlan(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Body() dto: DateRangeDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.createPlanForHousehold(householdId, dto);
  }

  @Get('meal-plans/:planId')
  @ApiOperation({ summary: 'Get a household meal plan with items' })
  @ApiOkResponse({ type: MealPlanResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async getPlan(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER', 'VIEWER']);
    return this.service.getPlanForHousehold(householdId, planId);
  }

  @Patch('meal-plans/:planId')
  @ApiOperation({ summary: 'Update a household meal plan' })
  async updatePlan(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number, @Body() dto: DateRangeDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.updatePlanForHousehold(householdId, planId, dto);
  }

  @Delete('meal-plans/:planId')
  @ApiOperation({ summary: 'Delete a household meal plan' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deletePlan(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.deletePlanForHousehold(householdId, planId);
  }

  @Post('meal-plans/:planId/items')
  @ApiOperation({ summary: 'Add a recipe to a household meal plan' })
  @ApiCreatedResponse({ type: MealPlanItemResponseDto })
  async addPlanItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number, @Body() dto: AddMealPlanItemDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.addPlanItemForHousehold(householdId, planId, dto);
  }

  @Patch('meal-plans/:planId/items/:itemId')
  @ApiOperation({ summary: 'Update a household meal plan item' })
  async updatePlanItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number, @Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateMealPlanItemDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.updatePlanItemForHousehold(householdId, planId, itemId, dto);
  }

  @Delete('meal-plans/:planId/items/:itemId')
  @ApiOperation({ summary: 'Delete a household meal plan item' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deletePlanItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('planId', ParseIntPipe) planId: number, @Param('itemId', ParseIntPipe) itemId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.deletePlanItemForHousehold(householdId, planId, itemId);
  }

  @Get('shopping-list')
  @ApiOperation({ summary: 'List a household shopping list' })
  @ApiOkResponse({ type: ShoppingListResponseDto })
  async listShoppingList(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER', 'VIEWER']);
    return this.service.listShoppingListForHousehold(householdId);
  }

  @Post('shopping-list/items')
  @ApiOperation({ summary: 'Add a household shopping list item' })
  @ApiCreatedResponse({ type: ShoppingListItemResponseDto })
  async addShoppingItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Body() dto: AddShoppingListItemDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.addShoppingItemForHousehold(householdId, dto);
  }

  @Patch('shopping-list/items/:itemId')
  @ApiOperation({ summary: 'Update a household shopping list item' })
  async updateShoppingItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateShoppingListItemDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.updateShoppingItemForHousehold(householdId, itemId, dto);
  }

  @Delete('shopping-list/items/:itemId')
  @ApiOperation({ summary: 'Delete a household shopping list item' })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteShoppingItem(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Param('itemId', ParseIntPipe) itemId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.deleteShoppingItemForHousehold(householdId, itemId);
  }

  @Post('shopping-list/from-recipe')
  @ApiOperation({ summary: 'Copy recipe ingredients into a household shopping list' })
  async addRecipeIngredients(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number, @Body() dto: AddRecipeIngredientsDto) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return dto.recipeIds?.length
      ? this.service.addRecipeIngredientsFromRecipesForHousehold(householdId, dto.recipeIds)
      : this.service.addRecipeIngredientsForHousehold(householdId, dto.recipeId!);
  }

  @Delete('shopping-list/completed')
  @ApiOperation({ summary: 'Clear completed household shopping list items' })
  async clearCompleted(@CurrentUser() user: AuthUser, @Param('householdId', ParseIntPipe) householdId: number) {
    await this.access.requireRole(user.id, householdId, ['OWNER', 'MEMBER']);
    return this.service.clearCompletedShoppingItemsForHousehold(householdId);
  }
}
