import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateRangeDto } from './dto/date-range.dto';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto';
import { AddMealPlanItemDto } from './dto/add-meal-plan-item.dto';
import { UpdateMealPlanItemDto } from './dto/update-meal-plan-item.dto';
import { AddShoppingListItemDto } from './dto/add-shopping-list-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { PLANNING_REPOSITORY, PlanningRepositoryPort } from './planning.repository';

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

  async addPlanItem(userId: number, planId: number, dto: AddMealPlanItemDto) {
    const plan = await this.requirePlan(userId, planId);
    this.validateDateInRange(dto.date, plan.start_date, plan.end_date);
    if (!(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    const item = await this.repository.addPlanItem(userId, planId, dto.recipeId, dto.date, dto.slot, dto.servings);
    if (!item) throw this.planNotFound();
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
    if (!(await this.repository.deletePlanItem(userId, planId, itemId))) throw new NotFoundException({ code: 'MEAL_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found' });
    return { message: 'Meal plan item removed' };
  }

  listShoppingList(userId: number) { return this.repository.listShoppingItems(userId).then((items) => ({ items })); }

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

  async clearCompletedShoppingItems(userId: number) {
    const removed = await this.repository.clearCompletedShoppingItems(userId);
    return { removed };
  }

  private requirePlan(userId: number, planId: number) {
    return this.repository.findPlan(userId, planId).then((plan) => {
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
}
