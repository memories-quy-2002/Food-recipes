import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MealPlanSlot } from './dto/add-meal-plan-item.dto';
import {
  calculateInventoryConsumption,
  formatInventoryQuantity,
  normalizeIngredientName,
  normalizePantryUnit,
  type InventoryPantryItem,
  type InventoryRecipeIngredient,
} from '../pantry/pantry-inventory';

export type MealPlanRecord = { plan_id: number; name: string; start_date: Date | string; end_date: Date | string; created_at: Date; updated_at: Date };
export type MealPlanItemRecord = { item_id: number; plan_id: number; recipe_id: number; recipe_name: string; planned_date: Date | string; slot: MealPlanSlot; servings: number; cooking_status: 'planned' | 'cooking' | 'completed'; created_at: Date };
export type ShoppingListItemRecord = { item_id: number; label: string; quantity: string | null; source_recipe_id: number | null; source_recipe_name: string | null; checked: boolean; created_at: Date; updated_at: Date };
export type StructuredShoppingIngredient = { name: string; quantity: number | null; unit: string | null; note: string | null; position: number; recipe_id?: number };
export type RecipeIngredientsRecord = { name: string; ingredients: string[]; structuredIngredients?: StructuredShoppingIngredient[] };
export type PreparedIngredientStatus = 'available' | 'missing' | 'needs_details';
export type PreparedIngredientRecord = {
  position: number;
  ingredient_name: string;
  required_quantity: number | null;
  required_unit: string | null;
  available_quantity: number | null;
  missing_quantity: number | null;
  pantry_id: number | null;
  status: PreparedIngredientStatus;
};
export type PrepareRecipeIngredientsRecord = {
  recipe_id: number;
  recipe_name: string;
  servings: number;
  ingredients: PreparedIngredientRecord[];
  added_shopping_items: number;
};

export interface PlanningRepositoryPort {
  listPlans(userId: number, from?: string, to?: string): Promise<MealPlanRecord[]>;
  findPlan(userId: number, planId: number): Promise<MealPlanRecord | null>;
  createPlan(userId: number, name: string, from: string, to: string): Promise<MealPlanRecord>;
  updatePlan(userId: number, planId: number, name: string, from: string, to: string): Promise<MealPlanRecord | null>;
  deletePlan(userId: number, planId: number): Promise<boolean>;
  listPlanItems(userId: number, planId: number): Promise<MealPlanItemRecord[]>;
  findPlanItem(userId: number, planId: number, itemId: number): Promise<MealPlanItemRecord | null>;
  recipeExists(recipeId: number): Promise<boolean>;
  addPlanItem(userId: number, planId: number, recipeId: number, date: string, slot: MealPlanSlot, servings: number): Promise<MealPlanItemRecord | null>;
  updatePlanItem(userId: number, planId: number, itemId: number, recipeId?: number, date?: string, slot?: MealPlanSlot, servings?: number): Promise<MealPlanItemRecord | null>;
  deletePlanItem(userId: number, planId: number, itemId: number): Promise<boolean>;
  listShoppingItems(userId: number): Promise<ShoppingListItemRecord[]>;
  addShoppingItem(userId: number, label: string, quantity: string | null, sourceRecipeId: number | null): Promise<ShoppingListItemRecord>;
  updateShoppingItem(userId: number, itemId: number, label?: string, quantity?: string | null, checked?: boolean): Promise<ShoppingListItemRecord | null>;
  deleteShoppingItem(userId: number, itemId: number): Promise<boolean>;
  recipeIngredients(recipeId: number): Promise<RecipeIngredientsRecord | null>;
  prepareRecipeIngredients(userId: number, recipeId: number, servings?: number): Promise<PrepareRecipeIngredientsRecord | null>;
  clearCompletedShoppingItems(userId: number): Promise<number>;
}

export const PLANNING_REPOSITORY = Symbol('PLANNING_REPOSITORY');

@Injectable()
export class PlanningRepository implements PlanningRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(userId: number, from?: string, to?: string): Promise<MealPlanRecord[]> {
    const rows = await this.prisma.$queryRaw<MealPlanRecord[]>(Prisma.sql`
      SELECT plan_id, name, start_date, end_date, created_at, updated_at
      FROM meal_plans
      WHERE user_id = ${userId}
        ${from ? Prisma.sql`AND end_date >= ${from}::date` : Prisma.empty}
        ${to ? Prisma.sql`AND start_date <= ${to}::date` : Prisma.empty}
      ORDER BY start_date ASC, plan_id ASC
    `);
    return rows;
  }

  async findPlan(userId: number, planId: number): Promise<MealPlanRecord | null> {
    const rows = await this.prisma.$queryRaw<MealPlanRecord[]>(Prisma.sql`
      SELECT plan_id, name, start_date, end_date, created_at, updated_at
      FROM meal_plans WHERE user_id = ${userId} AND plan_id = ${planId}
    `);
    return rows[0] ?? null;
  }

  async createPlan(userId: number, name: string, from: string, to: string): Promise<MealPlanRecord> {
    const rows = await this.prisma.$queryRaw<MealPlanRecord[]>(Prisma.sql`
      INSERT INTO meal_plans (user_id, name, start_date, end_date)
      VALUES (${userId}, ${name}, ${from}::date, ${to}::date)
      RETURNING plan_id, name, start_date, end_date, created_at, updated_at
    `);
    return rows[0];
  }

  async updatePlan(userId: number, planId: number, name: string, from: string, to: string): Promise<MealPlanRecord | null> {
    const rows = await this.prisma.$queryRaw<MealPlanRecord[]>(Prisma.sql`
      UPDATE meal_plans SET name = ${name}, start_date = ${from}::date, end_date = ${to}::date, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND plan_id = ${planId}
      RETURNING plan_id, name, start_date, end_date, created_at, updated_at
    `);
    return rows[0] ?? null;
  }

  async deletePlan(userId: number, planId: number): Promise<boolean> {
    return (await this.prisma.$executeRaw(Prisma.sql`DELETE FROM meal_plans WHERE user_id = ${userId} AND plan_id = ${planId}`)) > 0;
  }

  async listPlanItems(userId: number, planId: number): Promise<MealPlanItemRecord[]> {
    return this.prisma.$queryRaw<MealPlanItemRecord[]>(Prisma.sql`
      SELECT i.item_id, i.plan_id, i.recipe_id, r.recipe_name, i.planned_date, i.slot, i.servings,
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM cooking_sessions cs
                 WHERE cs.meal_plan_item_id = i.item_id AND cs.status IN ('active', 'paused')
               ) THEN 'cooking'
               WHEN EXISTS (
                 SELECT 1 FROM cooking_history ch
                 WHERE ch.meal_plan_item_id = i.item_id
               ) THEN 'completed'
               ELSE 'planned'
             END AS cooking_status,
             i.created_at
      FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id JOIN recipes r ON r.recipe_id = i.recipe_id
      WHERE p.user_id = ${userId} AND i.plan_id = ${planId}
      ORDER BY i.planned_date ASC, CASE i.slot WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END, i.item_id ASC
    `);
  }

  async findPlanItem(userId: number, planId: number, itemId: number): Promise<MealPlanItemRecord | null> {
    const rows = await this.prisma.$queryRaw<MealPlanItemRecord[]>(Prisma.sql`
      SELECT i.item_id, i.plan_id, i.recipe_id, r.recipe_name, i.planned_date, i.slot, i.servings,
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM cooking_sessions cs
                 WHERE cs.meal_plan_item_id = i.item_id AND cs.status IN ('active', 'paused')
               ) THEN 'cooking'
               WHEN EXISTS (
                 SELECT 1 FROM cooking_history ch
                 WHERE ch.meal_plan_item_id = i.item_id
               ) THEN 'completed'
               ELSE 'planned'
             END AS cooking_status,
             i.created_at
      FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id JOIN recipes r ON r.recipe_id = i.recipe_id
      WHERE p.user_id = ${userId} AND i.plan_id = ${planId} AND i.item_id = ${itemId}
    `);
    return rows[0] ?? null;
  }

  async recipeExists(recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId}`);
    return rows.length > 0;
  }

  async addPlanItem(userId: number, planId: number, recipeId: number, date: string, slot: MealPlanSlot, servings: number): Promise<MealPlanItemRecord | null> {
    const rows = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
      INSERT INTO meal_plan_items (plan_id, recipe_id, planned_date, slot, servings)
      SELECT p.plan_id, r.recipe_id, ${date}::date, ${slot}, ${servings}
      FROM meal_plans p CROSS JOIN recipes r
      WHERE p.plan_id = ${planId} AND p.user_id = ${userId} AND r.recipe_id = ${recipeId}
      RETURNING item_id
    `);
    return rows[0] ? this.findPlanItem(userId, planId, rows[0].item_id) : null;
  }

  async updatePlanItem(userId: number, planId: number, itemId: number, recipeId?: number, date?: string, slot?: MealPlanSlot, servings?: number): Promise<MealPlanItemRecord | null> {
    const item = await this.findPlanItem(userId, planId, itemId);
    if (!item) return null;
    const nextRecipeId = recipeId ?? item.recipe_id;
    const nextDate = date ?? this.dateText(item.planned_date);
    const nextSlot = slot ?? item.slot;
    const nextServings = servings ?? item.servings;
    if (!(await this.recipeExists(nextRecipeId))) return null;
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE meal_plan_items SET recipe_id = ${nextRecipeId}, planned_date = ${nextDate}::date, slot = ${nextSlot}, servings = ${nextServings}
      WHERE item_id = ${itemId} AND plan_id = ${planId}
    `);
    return this.findPlanItem(userId, planId, itemId);
  }

  async deletePlanItem(userId: number, planId: number, itemId: number): Promise<boolean> {
    return (await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM meal_plan_items i USING meal_plans p
      WHERE i.plan_id = p.plan_id AND p.user_id = ${userId} AND i.plan_id = ${planId} AND i.item_id = ${itemId}
    `)) > 0;
  }

  async listShoppingItems(userId: number): Promise<ShoppingListItemRecord[]> {
    return this.prisma.$queryRaw<ShoppingListItemRecord[]>(Prisma.sql`
      SELECT i.item_id, i.label, i.quantity, i.source_recipe_id, r.recipe_name AS source_recipe_name,
             i.checked, i.created_at, i.updated_at
      FROM shopping_list_items i LEFT JOIN recipes r ON r.recipe_id = i.source_recipe_id
      WHERE i.user_id = ${userId}
      ORDER BY i.checked ASC, i.created_at ASC, i.item_id ASC
    `);
  }

  async addShoppingItem(userId: number, label: string, quantity: string | null, sourceRecipeId: number | null): Promise<ShoppingListItemRecord> {
    const rows = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
      INSERT INTO shopping_list_items (user_id, label, quantity, source_recipe_id)
      VALUES (${userId}, ${label}, ${quantity}, ${sourceRecipeId}) RETURNING item_id
    `);
    return (await this.findShoppingItem(userId, rows[0].item_id))!;
  }

  async updateShoppingItem(userId: number, itemId: number, label?: string, quantity?: string | null, checked?: boolean): Promise<ShoppingListItemRecord | null> {
    const current = await this.findShoppingItem(userId, itemId);
    if (!current) return null;
    const nextLabel = label ?? current.label;
    const nextQuantity = quantity === undefined ? current.quantity : quantity;
    const nextChecked = checked ?? current.checked;
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE shopping_list_items SET label = ${nextLabel}, quantity = ${nextQuantity}, checked = ${nextChecked}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND item_id = ${itemId}
    `);
    return this.findShoppingItem(userId, itemId);
  }

  async deleteShoppingItem(userId: number, itemId: number): Promise<boolean> {
    return (await this.prisma.$executeRaw(Prisma.sql`DELETE FROM shopping_list_items WHERE user_id = ${userId} AND item_id = ${itemId}`)) > 0;
  }

  async recipeIngredients(recipeId: number): Promise<RecipeIngredientsRecord | null> {
    const rows = await this.prisma.$queryRaw<{ name: string; ingredients: string[] }[]>(Prisma.sql`SELECT recipe_name AS name, ingredients FROM recipes WHERE recipe_id = ${recipeId}`);
    if (!rows[0]) return null;
    const structuredIngredients = await this.prisma.$queryRaw<StructuredShoppingIngredient[]>(Prisma.sql`
      SELECT recipe_id, name, quantity, unit, note, position
      FROM recipe_ingredients
      WHERE recipe_id = ${recipeId}
      ORDER BY position ASC, ingredient_id ASC
    `);
    return { ...rows[0], structuredIngredients: (structuredIngredients ?? []).map((ingredient) => ({
      ...ingredient,
      recipe_id: Number(ingredient.recipe_id),
      quantity: ingredient.quantity === null ? null : Number(ingredient.quantity),
      position: Number(ingredient.position),
    })) };
  }

  async prepareRecipeIngredients(userId: number, recipeId: number, servings?: number): Promise<PrepareRecipeIngredientsRecord | null> {
    const [recipeRows, structuredRows, nutritionRows, pantryRows] = await Promise.all([
      this.prisma.$queryRaw<{ recipe_id: number; recipe_name: string; ingredients: string[] | null }[]>(Prisma.sql`
        SELECT recipe_id, recipe_name, ingredients
        FROM recipes
        WHERE recipe_id = ${recipeId} AND status = 'published'
      `),
      this.prisma.$queryRaw<Array<InventoryRecipeIngredient & { quantity_text: string | null; unit_text: string | null }>>(Prisma.sql`
        SELECT position, name, quantity, quantity_text, unit, unit_text
        FROM recipe_ingredients
        WHERE recipe_id = ${recipeId}
        ORDER BY position ASC, ingredient_id ASC
      `),
      this.prisma.$queryRaw<{ servings: number | null }[]>(Prisma.sql`
        SELECT servings FROM recipe_nutrition WHERE recipe_id = ${recipeId}
      `),
      this.prisma.$queryRaw<Array<InventoryPantryItem & { unit: string | null; quantity: number | string | null }>>(Prisma.sql`
        SELECT pantry_id, name, have, quantity, unit
        FROM pantry_items
        WHERE user_id = ${userId}
      `),
    ]);

    const recipe = recipeRows[0];
    if (!recipe) return null;

    const pantryItems: InventoryPantryItem[] = pantryRows.map((item) => ({
      pantry_id: Number(item.pantry_id),
      name: item.name,
      have: item.have,
      quantity: item.quantity === null ? null : Number(item.quantity),
      unit: normalizePantryUnit(item.unit),
    }));
    const effectiveServings = servings ?? Number(nutritionRows[0]?.servings ?? 1);
    let ingredients: PreparedIngredientRecord[];

    if (structuredRows.length) {
      const calculation = calculateInventoryConsumption(
        structuredRows,
        pantryItems,
        effectiveServings,
        Number(nutritionRows[0]?.servings ?? 1),
      );
      const consumptions = new Map(calculation.consumptions.map((item) => [item.position, item]));
      ingredients = structuredRows.map((ingredient) => {
        const consumption = consumptions.get(ingredient.position);
        if (consumption) {
          return {
            position: consumption.position,
            ingredient_name: consumption.ingredient_name,
            required_quantity: consumption.required_quantity,
            required_unit: consumption.required_unit,
            available_quantity: consumption.available_quantity,
            missing_quantity: consumption.missing_quantity,
            pantry_id: consumption.pantry_id,
            status: consumption.missing_quantity > 0 ? 'missing' : 'available',
          };
        }
        return {
          position: Number(ingredient.position),
          ingredient_name: ingredient.name.trim(),
          required_quantity: null,
          required_unit: normalizePantryUnit(ingredient.unit ?? ingredient.unit_text),
          available_quantity: null,
          missing_quantity: null,
          pantry_id: null,
          status: 'needs_details',
        };
      });
    } else {
      const availablePantry = pantryItems.filter((item) => item.have && (item.quantity === null || item.quantity > 0));
      ingredients = (recipe.ingredients ?? [])
        .map((name, position) => name.trim())
        .filter(Boolean)
        .map((name, position) => {
          const normalizedName = normalizeIngredientName(name);
          const pantryItem = availablePantry.find((item) => {
            const pantryName = normalizeIngredientName(item.name);
            return normalizedName === pantryName || normalizedName.includes(pantryName) || pantryName.includes(normalizedName);
          });
          return {
            position,
            ingredient_name: name,
            required_quantity: null,
            required_unit: null,
            available_quantity: null,
            missing_quantity: pantryItem ? 0 : null,
            pantry_id: pantryItem?.pantry_id ?? null,
            status: pantryItem ? 'available' : 'needs_details',
          };
        });
    }

    let addedShoppingItems = 0;
    for (const ingredient of ingredients.filter((item) => item.status !== 'available')) {
      const quantity = ingredient.missing_quantity !== null && ingredient.missing_quantity > 0 && ingredient.required_unit
        ? `${formatInventoryQuantity(ingredient.missing_quantity)} ${this.unitLabel(ingredient.required_unit)}`
        : null;
      const inserted = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
        INSERT INTO shopping_list_items (user_id, label, quantity, source_recipe_id)
        SELECT ${userId}, ${ingredient.ingredient_name}, ${quantity}, ${recipeId}
        WHERE NOT EXISTS (
          SELECT 1 FROM shopping_list_items
          WHERE user_id = ${userId}
            AND checked = FALSE
            AND LOWER(TRIM(label)) = LOWER(TRIM(${ingredient.ingredient_name}))
            AND COALESCE(quantity, '') = COALESCE(${quantity}, '')
        )
        RETURNING item_id
      `);
      addedShoppingItems += inserted.length;
    }

    return {
      recipe_id: Number(recipe.recipe_id),
      recipe_name: recipe.recipe_name,
      servings: effectiveServings,
      ingredients,
      added_shopping_items: addedShoppingItems,
    };
  }

  clearCompletedShoppingItems(userId: number): Promise<number> {
    return this.prisma.$executeRaw(Prisma.sql`DELETE FROM shopping_list_items WHERE user_id = ${userId} AND checked = TRUE`);
  }

  private findShoppingItem(userId: number, itemId: number): Promise<ShoppingListItemRecord | null> {
    return this.prisma.$queryRaw<ShoppingListItemRecord[]>(Prisma.sql`
      SELECT i.item_id, i.label, i.quantity, i.source_recipe_id, r.recipe_name AS source_recipe_name,
             i.checked, i.created_at, i.updated_at
      FROM shopping_list_items i LEFT JOIN recipes r ON r.recipe_id = i.source_recipe_id
      WHERE i.user_id = ${userId} AND i.item_id = ${itemId}
    `).then((rows) => rows[0] ?? null);
  }

  private dateText(value: Date | string): string {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  }

  private unitLabel(unit: string): string {
    const labels: Record<string, string> = {
      GRAM: 'g', KILOGRAM: 'kg', MILLILITER: 'ml', LITER: 'l',
      TEASPOON: 'tsp', TABLESPOON: 'tbsp', CUP: 'cup', PIECE: 'piece',
    };
    return labels[unit] ?? unit.toLowerCase();
  }
}
