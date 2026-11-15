import { createHash } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanningRepository } from './planning.repository';
import { calculateWeeklyShopping, type WeeklyShoppingLine } from './weekly-shopping.calculator';
import { WeeklyShoppingWriter } from './weekly-shopping.writer';

export type WeeklyShoppingInput = { planId: number; from: string; to: string };
export type ConfirmWeeklyShoppingInput = WeeklyShoppingInput & { snapshot: string };

export type WeeklyShoppingPreview = {
  planId: number;
  from: string;
  to: string;
  snapshot: string;
  mealCount: number;
  items: WeeklyShoppingLine[];
  needsDetails: string[];
  skippedRecipes: number[];
};

@Injectable()
export class WeeklyShoppingService {
  constructor(
    private readonly planning: PlanningRepository,
    private readonly writer: WeeklyShoppingWriter,
  ) {}

  async preview(userId: number, input: WeeklyShoppingInput, householdId?: number): Promise<WeeklyShoppingPreview> {
    const { planId, from, to } = input;
    const fromDate = Date.parse(from + 'T00:00:00Z');
    const toDate = Date.parse(to + 'T00:00:00Z');
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(from) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(to) ||
      !Number.isFinite(fromDate) || !Number.isFinite(toDate) ||
      toDate < fromDate || toDate - fromDate > 6 * 86_400_000) {
      throw new ConflictException({ code: 'INVALID_WEEK_RANGE', message: 'Choose a valid date range of at most seven days.' });
    }
    const plan = householdId === undefined
      ? await this.planning.findPlan(userId, planId)
      : await this.planning.findPlanForHousehold(householdId, planId);
    if (!plan) {
      throw new NotFoundException({
        code: 'MEAL_PLAN_NOT_FOUND',
        message: 'Meal plan not found',
      });
    }

    const planItems = householdId === undefined
      ? await this.planning.listPlanItems(userId, planId)
      : await this.planning.listPlanItemsForHousehold(householdId, planId);

    const pendingMeals = planItems.filter((item) => {
      const date = item.planned_date instanceof Date ? item.planned_date.toISOString().slice(0, 10) : String(item.planned_date).slice(0, 10);
      return item.source_type === 'recipe' && item.cooking_status === 'planned' && date >= from && date <= to;
    });
    const [prepared, existingItems] = await Promise.all([
      Promise.all(pendingMeals.map((item) =>
        this.planning.prepareRecipeIngredients(userId, item.recipe_id, item.servings, householdId))),
      householdId === undefined
        ? this.planning.listShoppingItems(userId)
        : this.planning.listShoppingItemsForHousehold(householdId),
    ]);

    const readyMeals = prepared.flatMap((result, index) => result
      ? [{ recipeId: pendingMeals[index].recipe_id, ingredients: result.ingredients }]
      : []);
    const skippedRecipes = pendingMeals.filter((_item, index) => !prepared[index])
      .map((item) => item.recipe_id);
    const calculation = calculateWeeklyShopping(readyMeals, existingItems);

    // This fingerprint detects changes to the selected meals, pantry-derived
    // requirements and the existing shopping list between preview and submit.
    const source = JSON.stringify({
      planId, from, to, householdId: householdId ?? null,
      lastUpdated: plan.updated_at,
      meals: pendingMeals.map((item) => ({
        id: item.item_id, recipeId: item.recipe_id, servings: item.servings,
        plannedDate: item.planned_date, slot: item.slot,
      })),
      prepared, existingItems: existingItems.map((item) => ({
        id: item.item_id, label: item.label, quantity: item.quantity, checked: item.checked,
      })),
    });
    const snapshot = createHash('sha256').update(source).digest('hex');
    return {
      planId, from, to, snapshot, mealCount: pendingMeals.length,
      items: calculation.items, needsDetails: calculation.needsDetails, skippedRecipes,
    };
  }

  async confirm(userId: number, input: ConfirmWeeklyShoppingInput, householdId?: number) {
    const preview = await this.preview(userId, input, householdId);
    if (preview.snapshot !== input.snapshot) {
      throw new ConflictException({
        code: 'WEEKLY_SHOPPING_STALE_PREVIEW',
        message: 'The meal plan, pantry, or shopping list changed. Preview again.',
      });
    }

    const newItems = preview.items.filter((item) => !item.alreadyListed);
    const addedShoppingItems = newItems.length
      ? await this.writer.addItems(userId, householdId, newItems)
      : 0;
    return { ...preview, addedShoppingItems };
  }
}
