import { createHash } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanningRepository } from './planning.repository';
import { calculateWeeklyShopping, type WeeklyShoppingLine } from './weekly-shopping.calculator';
import { WeeklyShoppingWriter } from './weekly-shopping.writer';

export type ConfirmWeeklyShoppingInput = { planId: number; snapshot: string };

export type WeeklyShoppingPreview = {
  planId: number;
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

  async preview(userId: number, planId: number, householdId?: number): Promise<WeeklyShoppingPreview> {
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

    const pendingMeals = planItems.filter((item) =>
      item.source_type === 'recipe' && item.cooking_status === 'planned');
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
      planId, householdId: householdId ?? null,
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
      planId, snapshot, mealCount: pendingMeals.length,
      items: calculation.items, needsDetails: calculation.needsDetails, skippedRecipes,
    };
  }

  async confirm(userId: number, input: ConfirmWeeklyShoppingInput, householdId?: number) {
    const preview = await this.preview(userId, input.planId, householdId);
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
