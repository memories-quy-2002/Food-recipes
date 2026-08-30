import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateRangeDto } from './dto/date-range.dto';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
import { AddLeftoverMealPlanItemDto } from './dto/add-leftover-meal-plan-item.dto';
import { UpdateMealPlanItemDto } from './dto/update-meal-plan-item.dto';
import { AddShoppingListItemDto } from './dto/add-shopping-list-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { PLANNING_REPOSITORY, PlanningRepositoryPort, StructuredShoppingIngredient } from './planning.repository';

@Injectable()
export class PlanningService {
  constructor(@Inject(PLANNING_REPOSITORY) private readonly repository: PlanningRepositoryPort) {}

  async listPlans(userId: number, query: MealPlanQueryDto) {
    this.validateOptionalRange(query.from, query.to);
    const plans = await this.repository.listPlans(userId, query.from, query.to);
    return { plans: plans.map((plan) => ({ ...plan, items: [] })) };
  }

  async getPlan(userId: number, planId: number) {
    const plan = await this.requirePlan(userId, planId);
    return { plan, items: await this.repository.listPlanItems(userId, planId) };
  }

  async createPlan(userId: number, dto: DateRangeDto) {
    this.validateRange(dto.from, dto.to);
    return { plan: await this.repository.createPlan(userId, this.normalizeName(dto.name), dto.from, dto.to) };
  }

  async updatePlan(userId: number, planId: number, dto: DateRangeDto) {
    this.validateRange(dto.from, dto.to);
    await this.requirePlan(userId, planId);
    for (const item of await this.repository.listPlanItems(userId, planId)) {
      this.validateDateInRange(this.dateText(item.planned_date), dto.from, dto.to);
    }
    const plan = await this.repository.updatePlan(userId, planId, this.normalizeName(dto.name), dto.from, dto.to);
    if (!plan) throw this.planNotFound();
    return { plan };
  }

  async deletePlan(userId: number, planId: number) {
    if (!(await this.repository.deletePlan(userId, planId))) throw this.planNotFound();
    return { message: 'Meal plan removed' };
  }

  async listPlansForHousehold(householdId: number, query: MealPlanQueryDto) {
    this.validateOptionalRange(query.from, query.to);
    const plans = await this.repository.listPlansForHousehold(householdId, query.from, query.to);
    return { plans: plans.map((plan) => ({ ...plan, items: [] })) };
  }

  async getPlanForHousehold(householdId: number, planId: number) {
    const plan = await this.requireHouseholdPlan(householdId, planId);
    return { plan, items: await this.repository.listPlanItemsForHousehold(householdId, planId) };
  }

  async createPlanForHousehold(householdId: number, dto: DateRangeDto) {
    this.validateRange(dto.from, dto.to);
    return { plan: await this.repository.createPlanForHousehold(householdId, this.normalizeName(dto.name), dto.from, dto.to) };
  }

  async updatePlanForHousehold(householdId: number, planId: number, dto: DateRangeDto) {
    this.validateRange(dto.from, dto.to);
    await this.requireHouseholdPlan(householdId, planId);
    for (const item of await this.repository.listPlanItemsForHousehold(householdId, planId)) {
      this.validateDateInRange(this.dateText(item.planned_date), dto.from, dto.to);
    }
    const plan = await this.repository.updatePlanForHousehold(householdId, planId, this.normalizeName(dto.name), dto.from, dto.to);
    if (!plan) throw this.planNotFound();
    return { plan };
  }

  async deletePlanForHousehold(householdId: number, planId: number) {
    if (!(await this.repository.deletePlanForHousehold(householdId, planId))) throw this.planNotFound();
    return { message: 'Meal plan removed' };
  }

  async addPlanItem(userId: number, planId: number, dto: AddMealPlanItemDto) {
    const plan = await this.requirePlan(userId, planId);
    this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    if (!(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.addPlanItem(userId, planId, dto.recipeId, dto.date, dto.slot, dto.servings);
    if (!item) throw this.planNotFound();
    return { item };
  }

  async addLeftoverPlanItem(userId: number, planId: number, dto: AddLeftoverMealPlanItemDto) {
    const plan = await this.requirePlan(userId, planId);
    this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    const item = await this.repository.addLeftoverPlanItem?.(userId, planId, dto);
    if (!item) throw new NotFoundException({ code: 'LEFTOVER_NOT_AVAILABLE', message: 'Leftover batch is not available for this plan' });
    return { item };
  }

  async updatePlanItem(userId: number, planId: number, itemId: number, dto: UpdateMealPlanItemDto) {
    const plan = await this.requirePlan(userId, planId);
    if (dto.date) this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    if (dto.recipeId && !(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.updatePlanItem(userId, planId, itemId, dto.recipeId, dto.date, dto.slot, dto.servings);
    if (!item) throw new NotFoundException({ code: 'MEAL_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found' });
    return { item };
  }

  async deletePlanItem(userId: number, planId: number, itemId: number) {
    await this.requirePlan(userId, planId);
    if (!(await this.repository.deletePlanItemAndRecordRemoval(userId, planId, itemId))) throw new NotFoundException({ code: 'MEAL_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found' });
    return { message: 'Meal plan item removed' };
  }

  async addPlanItemForHousehold(householdId: number, planId: number, dto: AddMealPlanItemDto) {
    const plan = await this.requireHouseholdPlan(householdId, planId);
    this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    if (!(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.addPlanItemForHousehold(householdId, planId, dto.recipeId, dto.date, dto.slot, dto.servings);
    if (!item) throw this.planNotFound();
    return { item };
  }

  async addLeftoverPlanItemForHousehold(householdId: number, planId: number, dto: AddLeftoverMealPlanItemDto) {
    const plan = await this.requireHouseholdPlan(householdId, planId);
    this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    const item = await this.repository.addLeftoverPlanItemForHousehold?.(householdId, planId, dto);
    if (!item) throw new NotFoundException({ code: 'LEFTOVER_NOT_AVAILABLE', message: 'Leftover batch is not available for this plan' });
    return { item };
  }

  async updatePlanItemForHousehold(householdId: number, planId: number, itemId: number, dto: UpdateMealPlanItemDto) {
    const plan = await this.requireHouseholdPlan(householdId, planId);
    if (dto.date) this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    if (dto.recipeId && !(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.updatePlanItemForHousehold(householdId, planId, itemId, dto.recipeId, dto.date, dto.slot, dto.servings);
    if (!item) throw new NotFoundException({ code: 'MEAL_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found' });
    return { item };
  }

  async deletePlanItemForHousehold(userId: number, householdId: number, planId: number, itemId: number) {
    await this.requireHouseholdPlan(householdId, planId);
    if (!(await this.repository.deletePlanItemAndRecordRemovalForHousehold(userId, householdId, planId, itemId))) throw new NotFoundException({ code: 'MEAL_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found' });
    return { message: 'Meal plan item removed' };
  }

  listShoppingList(userId: number) { return this.repository.listShoppingItems(userId).then((items) => ({ items })); }

  listShoppingListForHousehold(householdId: number) { return this.repository.listShoppingItemsForHousehold(householdId).then((items) => ({ items })); }

  async addShoppingItem(userId: number, dto: AddShoppingListItemDto) {
    if (dto.sourceRecipeId && !(await this.repository.recipeExists(dto.sourceRecipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.addShoppingItem(userId, this.normalizeName(dto.label), dto.quantity?.trim() || null, dto.sourceRecipeId ?? null);
    return { item };
  }

  async updateShoppingItem(userId: number, itemId: number, dto: UpdateShoppingListItemDto) {
    const label = dto.label === undefined ? undefined : this.normalizeName(dto.label);
    const item = await this.repository.updateShoppingItem(userId, itemId, label, dto.quantity === undefined ? undefined : dto.quantity.trim() || null, dto.checked);
    if (!item) throw new NotFoundException({ code: 'SHOPPING_ITEM_NOT_FOUND', message: 'Shopping list item not found' });
    return { item };
  }

  async deleteShoppingItem(userId: number, itemId: number) {
    if (!(await this.repository.deleteShoppingItem(userId, itemId))) throw new NotFoundException({ code: 'SHOPPING_ITEM_NOT_FOUND', message: 'Shopping list item not found' });
    return { message: 'Shopping list item removed' };
  }

  async addShoppingItemForHousehold(householdId: number, dto: AddShoppingListItemDto) {
    if (dto.sourceRecipeId && !(await this.repository.recipeExists(dto.sourceRecipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.addShoppingItemForHousehold(householdId, this.normalizeName(dto.label), dto.quantity?.trim() || null, dto.sourceRecipeId ?? null);
    return { item };
  }

  async updateShoppingItemForHousehold(householdId: number, itemId: number, dto: UpdateShoppingListItemDto) {
    const label = dto.label === undefined ? undefined : this.normalizeName(dto.label);
    const item = await this.repository.updateShoppingItemForHousehold(householdId, itemId, label, dto.quantity === undefined ? undefined : dto.quantity.trim() || null, dto.checked);
    if (!item) throw new NotFoundException({ code: 'SHOPPING_ITEM_NOT_FOUND', message: 'Shopping list item not found' });
    return { item };
  }

  async deleteShoppingItemForHousehold(householdId: number, itemId: number) {
    if (!(await this.repository.deleteShoppingItemForHousehold(householdId, itemId))) throw new NotFoundException({ code: 'SHOPPING_ITEM_NOT_FOUND', message: 'Shopping list item not found' });
    return { message: 'Shopping list item removed' };
  }

  async addRecipeIngredients(userId: number, recipeId: number) {
    const recipe = await this.repository.recipeIngredients(recipeId);
    if (!recipe) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const items = [];
    for (const ingredient of recipe.ingredients ?? []) {
      const label = ingredient.trim();
      if (label) items.push(await this.repository.addShoppingItem(userId, label, null, recipeId));
    }
    return { recipe: recipe.name, items };
  }

  async addRecipeIngredientsForHousehold(householdId: number, recipeId: number) {
    const recipe = await this.repository.recipeIngredients(recipeId);
    if (!recipe) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const items = [];
    for (const ingredient of recipe.ingredients ?? []) {
      const label = ingredient.trim();
      if (label) items.push(await this.repository.addShoppingItemForHousehold(householdId, label, null, recipeId));
    }
    return { recipe: recipe.name, items };
  }

  async addRecipeIngredientsFromRecipes(userId: number, recipeIds: number[]) {
    const uniqueRecipeIds = [...new Set(recipeIds.map(Number))];
    const recipes = await Promise.all(uniqueRecipeIds.map((recipeId) => this.repository.recipeIngredients(recipeId)));
    if (recipes.some((recipe) => !recipe)) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });

    const structured: Array<StructuredShoppingIngredient & { sourceRecipeId: number }> = [];
    const legacy: Array<{ label: string; sourceRecipeId: number }> = [];
    recipes.forEach((recipe, index) => {
      if (!recipe) return;
      const sourceRecipeId = uniqueRecipeIds[index];
      if (recipe.structuredIngredients?.length) {
        recipe.structuredIngredients.forEach((ingredient) => structured.push({ ...ingredient, sourceRecipeId }));
      } else {
        recipe.ingredients.forEach((ingredient) => {
          const label = ingredient.trim();
          if (label) legacy.push({ label, sourceRecipeId });
        });
      }
    });

    const items = [];
    for (const ingredient of this.consolidateStructuredIngredients(structured)) {
      items.push(await this.repository.addShoppingItem(userId, ingredient.name, this.formatStructuredQuantity(ingredient), ingredient.sourceRecipeId));
    }
    for (const ingredient of legacy) {
      items.push(await this.repository.addShoppingItem(userId, ingredient.label, null, ingredient.sourceRecipeId));
    }
    return { recipes: recipes.filter(Boolean).map((recipe) => recipe!.name), items };
  }

  async addRecipeIngredientsFromRecipesForHousehold(householdId: number, recipeIds: number[]) {
    const uniqueRecipeIds = [...new Set(recipeIds.map(Number))];
    const recipes = await Promise.all(uniqueRecipeIds.map((recipeId) => this.repository.recipeIngredients(recipeId)));
    if (recipes.some((recipe) => !recipe)) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });

    const structured: Array<StructuredShoppingIngredient & { sourceRecipeId: number }> = [];
    const legacy: Array<{ label: string; sourceRecipeId: number }> = [];
    recipes.forEach((recipe, index) => {
      if (!recipe) return;
      const sourceRecipeId = uniqueRecipeIds[index];
      if (recipe.structuredIngredients?.length) {
        recipe.structuredIngredients.forEach((ingredient) => structured.push({ ...ingredient, sourceRecipeId }));
      } else {
        recipe.ingredients.forEach((ingredient) => {
          const label = ingredient.trim();
          if (label) legacy.push({ label, sourceRecipeId });
        });
      }
    });

    const items = [];
    for (const ingredient of this.consolidateStructuredIngredients(structured)) {
      items.push(await this.repository.addShoppingItemForHousehold(householdId, ingredient.name, this.formatStructuredQuantity(ingredient), ingredient.sourceRecipeId));
    }
    for (const ingredient of legacy) {
      items.push(await this.repository.addShoppingItemForHousehold(householdId, ingredient.label, null, ingredient.sourceRecipeId));
    }
    return { recipes: recipes.filter(Boolean).map((recipe) => recipe!.name), items };
  }

  async prepareRecipeIngredients(userId: number, recipeId: number, servings?: number) {
    const result = await this.repository.prepareRecipeIngredients(userId, recipeId, servings);
    if (!result) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    return result;
  }

  async clearCompletedShoppingItems(userId: number) {
    const removed = await this.repository.clearCompletedShoppingItems(userId);
    return { removed };
  }

  async clearCompletedShoppingItemsForHousehold(householdId: number) {
    const removed = await this.repository.clearCompletedShoppingItemsForHousehold(householdId);
    return { removed };
  }

  private requirePlan(userId: number, planId: number) {
    return this.repository.findPlan(userId, planId).then((plan) => {
      if (!plan) throw this.planNotFound();
      return plan;
    });
  }

  private requireHouseholdPlan(householdId: number, planId: number) {
    return this.repository.findPlanForHousehold(householdId, planId).then((plan) => {
      if (!plan) throw this.planNotFound();
      return plan;
    });
  }

  private normalizeName(value: string): string {
    const normalized = value.trim();
    if (!normalized) throw new BadRequestException({ code: 'PLANNING_NAME_EMPTY', message: 'Name or label cannot be empty' });
    return normalized;
  }

  private validateOptionalRange(from?: string, to?: string) {
    if ((from && !to) || (!from && to)) throw this.invalidRange();
    if (from && to) this.validateRange(from, to);
  }

  private validateRange(from: string, to: string) {
    const start = this.parseDate(from);
    const end = this.parseDate(to);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (days < 1 || days > 31) throw this.invalidRange();
  }

  private validateDateInRange(value: string, from: Date | string, to: Date | string) {
    const date = this.parseDate(value).getTime();
    if (date < this.parseDate(this.dateText(from)).getTime() || date > this.parseDate(this.dateText(to)).getTime()) throw new BadRequestException({ code: 'MEAL_PLAN_DATE_OUT_OF_RANGE', message: 'Planned date must be inside the meal plan range' });
  }

  private parseDate(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw this.invalidRange();
    return date;
  }

  private dateText(value: Date | string): string { return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10); }
  private invalidRange(): BadRequestException { return new BadRequestException({ code: 'MEAL_PLAN_DATE_RANGE_INVALID', message: 'Meal plan dates must be an inclusive range of 1 to 31 days' }); }
  private planNotFound(): NotFoundException { return new NotFoundException({ code: 'MEAL_PLAN_NOT_FOUND', message: 'Meal plan not found' }); }

  private consolidateStructuredIngredients(ingredients: Array<StructuredShoppingIngredient & { sourceRecipeId: number }>) {
    const consolidated: Array<StructuredShoppingIngredient & { sourceRecipeId: number }> = [];
    for (const ingredient of ingredients) {
      if (ingredient.quantity === null || !ingredient.unit) {
        consolidated.push(ingredient);
        continue;
      }
      const index = consolidated.findIndex((candidate) => candidate.name.toLowerCase() === ingredient.name.toLowerCase() && candidate.note === ingredient.note && candidate.unit === ingredient.unit && candidate.quantity !== null);
      if (index === -1) consolidated.push({ ...ingredient });
      else consolidated[index] = { ...consolidated[index], quantity: Number((consolidated[index].quantity! + ingredient.quantity).toFixed(2)) };
    }
    return consolidated;
  }

  private formatStructuredQuantity(ingredient: StructuredShoppingIngredient): string | null {
    if (ingredient.quantity === null) return ingredient.note;
    const unitLabels: Record<string, string> = { GRAM: 'g', KILOGRAM: 'kg', MILLILITER: 'ml', LITER: 'l', TEASPOON: 'tsp', TABLESPOON: 'tbsp', CUP: 'cup', PIECE: 'piece' };
    return `${ingredient.quantity}${ingredient.unit ? ` ${unitLabels[ingredient.unit] ?? ingredient.unit.toLowerCase()}` : ''}${ingredient.note ? `, ${ingredient.note}` : ''}`;
  }
}
