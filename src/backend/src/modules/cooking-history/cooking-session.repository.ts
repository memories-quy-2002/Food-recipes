import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CookingSessionEditableStatus } from './dto/update-cooking-session.dto';
import {
  calculateInventoryConsumption,
  convertQuantity,
  formatInventoryQuantity,
  type InventoryPantryItem,
  type InventoryRecipeIngredient,
  type InventoryShortage,
} from '../pantry/pantry-inventory';

export type CookingSessionRecord = {
  session_id: number;
  user_id: number;
  recipe_id: number;
  recipe_name: string;
  meal_plan_item_id: number | null;
  source_type?: 'recipe' | 'leftover';
  leftover_batch_id?: number | null;
  household_id?: number | null;
  planned_date: Date | string | null;
  slot: string | null;
  servings: number;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  started_at: Date;
  last_active_at: Date;
  paused_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CompletedCookingSessionResult = {
  session: CookingSessionRecord;
  history: {
    history_id: number;
    user_id: number;
    recipe_id: number;
    recipe_name: string;
    meal_plan_item_id: number | null;
    source_type?: 'recipe' | 'leftover';
    leftover_batch_id?: number | null;
    planned_date: Date | string | null;
    slot: string | null;
    servings: number;
    started_at: Date;
    completed_at: Date;
    created_at: Date;
  };
};

export type ShoppingListHandoffResult = {
  status: 'shopping_list_updated';
  session: CookingSessionRecord;
  shortages: InventoryShortage[];
  added_shopping_items: number;
};

export type CookingSessionCompletionNeedsConfirmation = {
  status: 'needs_confirmation';
  shortages: InventoryShortage[];
};

export type CookingSessionCompletionInvalidRecipe = {
  status: 'invalid_recipe';
  ingredient_names: string[];
};

export type CookingSessionCompletionResult =
  | CompletedCookingSessionResult
  | ShoppingListHandoffResult
  | CookingSessionCompletionNeedsConfirmation
  | CookingSessionCompletionInvalidRecipe;

export interface CookingSessionRepositoryPort {
  findActive(userId: number, recipeId?: number): Promise<CookingSessionRecord | null>;
  start(userId: number, recipeId: number, mealPlanItemId: number | null, servings: number | null, sourceType?: 'recipe' | 'leftover', leftoverBatchId?: number | null, householdId?: number | null): Promise<CookingSessionRecord>;
  update(userId: number, sessionId: number, currentStep?: number, status?: CookingSessionEditableStatus): Promise<CookingSessionRecord | null>;
  complete(userId: number, sessionId: number, action?: 'complete' | 'shopping'): Promise<CookingSessionCompletionResult | null>;
  abandon(userId: number, sessionId: number): Promise<boolean>;
  recipeExists(recipeId: number): Promise<boolean>;
  mealPlanItemBelongsToUser(userId: number, mealPlanItemId: number, recipeId: number): Promise<boolean>;
  leftoverAvailable?(userId: number, leftoverBatchId: number, recipeId: number): Promise<boolean>;
  leftoverStartContext?(userId: number, recipeId: number, leftoverBatchId: number, mealPlanItemId: number | null, householdId: number | null): Promise<{ mode: 'direct' | 'reserved'; available_servings: number; leftover_batch_id: number } | null>;
  mealPlanItemBelongsToHousehold?(householdId: number, mealPlanItemId: number, recipeId: number): Promise<boolean>;
}

export const COOKING_SESSION_REPOSITORY = Symbol('COOKING_SESSION_REPOSITORY');

const sessionProjection = Prisma.sql`
  s.session_id, s.user_id, s.recipe_id, r.recipe_name,
  s.meal_plan_item_id, s.source_type, s.leftover_batch_id, s.household_id, i.planned_date, i.slot, s.servings,
  s.current_step, s.status, s.started_at, s.last_active_at,
  s.paused_at, s.completed_at, s.created_at, s.updated_at
`;

@Injectable()
export class CookingSessionRepository implements CookingSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(userId: number, recipeId?: number): Promise<CookingSessionRecord | null> {
    const rows = await this.prisma.$queryRaw<CookingSessionRecord[]>(Prisma.sql`
      SELECT ${sessionProjection}
      FROM cooking_sessions s
      JOIN recipes r ON r.recipe_id = s.recipe_id
      LEFT JOIN meal_plan_items i ON i.item_id = s.meal_plan_item_id
      WHERE s.user_id = ${userId}
        AND s.status IN ('active', 'paused')
        ${recipeId === undefined ? Prisma.empty : Prisma.sql`AND s.recipe_id = ${recipeId}`}
      ORDER BY s.updated_at DESC, s.session_id DESC
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async start(
    userId: number,
    recipeId: number,
    mealPlanItemId: number | null,
    servings: number | null, sourceType: 'recipe' | 'leftover' = 'recipe', leftoverBatchId: number | null = null, householdId: number | null = null,
  ): Promise<CookingSessionRecord> {
    const sessionIdentity = mealPlanItemId === null
      ? Prisma.sql`AND meal_plan_item_id IS NULL`
      : Prisma.sql`AND meal_plan_item_id = ${mealPlanItemId}`;
    const existing = await this.prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
      SELECT session_id
      FROM cooking_sessions
      WHERE user_id = ${userId}
        AND recipe_id = ${recipeId}
        AND status IN ('active', 'paused') AND source_type = ${sourceType} AND leftover_batch_id IS NOT DISTINCT FROM ${leftoverBatchId}
        ${sessionIdentity}
      ORDER BY updated_at DESC, session_id DESC
      LIMIT 1
    `);

    if (existing[0]) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE cooking_sessions
        SET meal_plan_item_id = COALESCE(${mealPlanItemId}, meal_plan_item_id),
            servings = COALESCE(${servings}, servings),
            status = 'active',
            paused_at = NULL,
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ${existing[0].session_id} AND user_id = ${userId}
      `);
      return (await this.findById(userId, existing[0].session_id))!;
    }

    let rows: { session_id: number }[];
    try {
      rows = await this.prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
      INSERT INTO cooking_sessions (
        user_id, recipe_id, meal_plan_item_id, source_type, leftover_batch_id, household_id, servings, current_step, status,
        started_at, last_active_at
      ) VALUES (
        ${userId}, ${recipeId}, ${mealPlanItemId}, ${sourceType}, ${leftoverBatchId}, ${householdId}, COALESCE(
          ${servings},
          (SELECT servings FROM recipe_nutrition WHERE recipe_id = ${recipeId}),
          1
        ), 0,
        'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING session_id
      `);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException({ code: 'COOKING_SESSION_ALREADY_ACTIVE', message: 'This meal-plan item is already being cooked' });
      throw error;
    }
    return (await this.findById(userId, rows[0].session_id))!;
  }

  async update(
    userId: number,
    sessionId: number,
    currentStep?: number,
    status?: CookingSessionEditableStatus,
  ): Promise<CookingSessionRecord | null> {
    const updates: Prisma.Sql[] = [
      Prisma.sql`last_active_at = CURRENT_TIMESTAMP`,
      Prisma.sql`updated_at = CURRENT_TIMESTAMP`,
    ];
    if (currentStep !== undefined) updates.push(Prisma.sql`current_step = ${currentStep}`);
    if (status !== undefined) {
      updates.push(Prisma.sql`status = ${status}`);
      updates.push(status === 'paused'
        ? Prisma.sql`paused_at = CURRENT_TIMESTAMP`
        : Prisma.sql`paused_at = NULL`);
    }

    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE cooking_sessions
      SET ${Prisma.join(updates, ', ')}
      WHERE session_id = ${sessionId}
        AND user_id = ${userId}
        AND status IN ('active', 'paused')
    `);
    return this.findById(userId, sessionId);
  }

  async complete(userId: number, sessionId: number, action?: 'complete' | 'shopping'): Promise<CookingSessionCompletionResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const sessionRows = await tx.$queryRaw<Array<CookingSessionRecord & { quantity?: never }>>(Prisma.sql`
        SELECT ${sessionProjection}
        FROM cooking_sessions s
        JOIN recipes r ON r.recipe_id = s.recipe_id
        LEFT JOIN meal_plan_items i ON i.item_id = s.meal_plan_item_id
        WHERE s.user_id = ${userId}
          AND s.session_id = ${sessionId}
          AND s.status IN ('active', 'paused')
        FOR UPDATE OF s
      `);
      const session = sessionRows[0];
      if (!session) return null;

      const ingredientRows = await tx.$queryRaw<Array<InventoryRecipeIngredient & {
        quantity: number | string | null;
        quantity_text: string | null;
        unit: string | null;
        unit_text: string | null;
      }>>(Prisma.sql`
        SELECT ingredient_id, position, name, quantity, quantity_text, unit, unit_text
        FROM recipe_ingredients
        WHERE recipe_id = ${session.recipe_id}
        ORDER BY position ASC, ingredient_id ASC
      `);
      const isLeftover = session.source_type === 'leftover';
      if (!ingredientRows.length && !isLeftover) {
        const legacyRows = await tx.$queryRaw<{ ingredients: string[] | null }[]>(Prisma.sql`
          SELECT ingredients FROM recipes WHERE recipe_id = ${session.recipe_id}
        `);
        return {
          status: 'invalid_recipe',
          ingredient_names: legacyRows[0]?.ingredients?.filter((ingredient) => ingredient.trim()) ?? [],
        };
      }
      const nutritionRows = await tx.$queryRaw<{ servings: number | null }[]>(Prisma.sql`
        SELECT servings FROM recipe_nutrition WHERE recipe_id = ${session.recipe_id}
      `);
      const pantryRows = isLeftover ? [] : await tx.$queryRaw<Array<InventoryPantryItem & { quantity: number | string | null }>>(Prisma.sql`
        SELECT pantry_id, name, have, quantity, unit
        FROM pantry_items
        WHERE user_id = ${userId}
        FOR UPDATE
      `);
      const pantryItems = pantryRows.map((item) => ({
        ...item,
        quantity: item.quantity === null ? null : Number(item.quantity),
      }));
      const calculation = calculateInventoryConsumption(
        ingredientRows,
        pantryItems,
        session.servings,
        nutritionRows[0]?.servings ?? 1,
      );
      if (!isLeftover && calculation.invalid_ingredients.length) {
        return { status: 'invalid_recipe', ingredient_names: calculation.invalid_ingredients };
      }
      if (!isLeftover && calculation.shortages.length && action === undefined) {
        return { status: 'needs_confirmation', shortages: calculation.shortages };
      }
      if (!isLeftover && calculation.shortages.length && action === 'shopping') {
        let addedShoppingItems = 0;
        for (const shortage of calculation.shortages) {
          const quantity = `${formatInventoryQuantity(shortage.missing_quantity)} ${this.unitLabel(shortage.required_unit)}`;
          const inserted = await tx.$queryRaw<{ item_id: number }[]>(Prisma.sql`
            INSERT INTO shopping_list_items (user_id, label, quantity, source_recipe_id)
            SELECT ${userId}, ${shortage.ingredient_name}, ${quantity}, ${session.recipe_id}
            WHERE NOT EXISTS (
              SELECT 1 FROM shopping_list_items
              WHERE user_id = ${userId}
                AND checked = FALSE
                AND LOWER(TRIM(label)) = LOWER(TRIM(${shortage.ingredient_name}))
                AND COALESCE(quantity, '') = ${quantity}
            )
            RETURNING item_id
          `);
          addedShoppingItems += inserted.length;
        }
        return {
          status: 'shopping_list_updated',
          session,
          shortages: calculation.shortages,
          added_shopping_items: addedShoppingItems,
        };
      }

      const completedRows = await tx.$queryRaw<Array<CookingSessionRecord & { completed_at: Date }>>(Prisma.sql`
        UPDATE cooking_sessions
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ${sessionId}
          AND user_id = ${userId}
          AND status IN ('active', 'paused')
        RETURNING session_id, user_id, recipe_id, ${session.recipe_name} AS recipe_name,
                  meal_plan_item_id, source_type, leftover_batch_id, household_id, servings, current_step, status, started_at,
                  last_active_at, paused_at, completed_at, created_at, updated_at
      `);
      const completed = completedRows[0];
      if (!completed) return null;

      const historySourceType = completed.source_type ?? 'recipe';
      const historyLeftoverBatchId = historySourceType === 'leftover' ? (completed.leftover_batch_id ?? null) : null;
      let historyRows: Array<{
        history_id: number;
        user_id: number;
        recipe_id: number;
        meal_plan_item_id: number | null;
        source_type: 'recipe' | 'leftover';
        leftover_batch_id: number | null;
        servings: number;
        started_at: Date;
        completed_at: Date;
        created_at: Date;
      }>;
      try {
        historyRows = await tx.$queryRaw<Array<{
          history_id: number;
          user_id: number;
          recipe_id: number;
          meal_plan_item_id: number | null;
          source_type: 'recipe' | 'leftover';
          leftover_batch_id: number | null;
          servings: number;
          started_at: Date;
          completed_at: Date;
          created_at: Date;
        }>>(Prisma.sql`
        INSERT INTO cooking_history (
          user_id, recipe_id, meal_plan_item_id, source_type, leftover_batch_id, servings, started_at, completed_at
        ) VALUES (
          ${userId}, ${completed.recipe_id}, ${completed.meal_plan_item_id}, ${historySourceType}, ${historyLeftoverBatchId},
          ${completed.servings}, ${completed.started_at}, ${completed.completed_at}
        )
        RETURNING history_id, user_id, recipe_id, meal_plan_item_id, source_type, leftover_batch_id, servings,
                  started_at, completed_at, created_at
        `);
      } catch (error) {
        if ((error as { code?: string }).code === '23505') throw new ConflictException({ code: 'COOKING_SESSION_ALREADY_COMPLETED', message: 'This planned meal has already been completed' });
        throw error;
      }
      const history = historyRows[0];
      const pantryById = new Map(pantryItems.map((item) => [item.pantry_id, item]));
      if (isLeftover && completed.meal_plan_item_id === null && completed.leftover_batch_id) {
        const consumed = await tx.$queryRaw<{ leftover_id: number }[]>(Prisma.sql`UPDATE leftover_batches SET remaining_servings = remaining_servings - ${completed.servings} WHERE leftover_id = ${completed.leftover_batch_id} AND (user_id = ${userId} OR household_id = ${completed.household_id ?? null}) AND remaining_servings >= ${completed.servings} RETURNING leftover_id`);
        if (!consumed[0]) throw new ConflictException({ code: 'LEFTOVER_SERVINGS_UNAVAILABLE', message: 'The leftover no longer has enough servings to complete this cook' });
      }
      if (isLeftover) return {
        session: this.toSessionRecord(completed),
        history: { history_id: history.history_id, user_id: history.user_id, recipe_id: history.recipe_id, recipe_name: completed.recipe_name, meal_plan_item_id: history.meal_plan_item_id, source_type: history.source_type, leftover_batch_id: history.leftover_batch_id, planned_date: session.planned_date, slot: session.slot, servings: history.servings, started_at: history.started_at, completed_at: history.completed_at, created_at: history.created_at },
      };
      for (const consumption of calculation.consumptions) {
        if (consumption.pantry_id && consumption.deducted_quantity > 0) {
          const pantryItem = pantryById.get(consumption.pantry_id);
          const deductedInPantryUnit = pantryItem?.unit
            ? convertQuantity(consumption.deducted_quantity, consumption.required_unit, pantryItem.unit)
            : null;
          if (deductedInPantryUnit !== null) {
            await tx.$executeRaw(Prisma.sql`
              UPDATE pantry_items
              SET quantity = GREATEST(quantity - ${deductedInPantryUnit}, 0),
                  have = CASE WHEN quantity - ${deductedInPantryUnit} <= 0 THEN FALSE ELSE have END,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ${userId} AND pantry_id = ${consumption.pantry_id}
            `);
          }
        }
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO cooking_ingredient_usage (
            history_id, user_id, pantry_id, ingredient_position, ingredient_name,
            required_quantity, unit, deducted_quantity, missing_quantity
          ) VALUES (
            ${history.history_id}, ${userId}, ${consumption.pantry_id}, ${consumption.position},
            ${consumption.ingredient_name}, ${consumption.required_quantity}, ${consumption.required_unit},
            ${consumption.deducted_quantity}, ${consumption.missing_quantity}
          )
        `);
      }

      return {
        session: this.toSessionRecord(completed),
        history: {
          history_id: history.history_id,
          user_id: history.user_id,
          recipe_id: history.recipe_id,
          recipe_name: completed.recipe_name,
          meal_plan_item_id: history.meal_plan_item_id,
          source_type: history.source_type,
          leftover_batch_id: history.leftover_batch_id,
          planned_date: session.planned_date,
          slot: session.slot,
          servings: history.servings,
          started_at: history.started_at,
          completed_at: history.completed_at,
          created_at: history.created_at,
        },
      };
    });
  }

  async abandon(userId: number, sessionId: number): Promise<boolean> {
    const affected = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE cooking_sessions
      SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP, last_active_at = CURRENT_TIMESTAMP
      WHERE session_id = ${sessionId}
        AND user_id = ${userId}
        AND status IN ('active', 'paused')
    `);
    return affected > 0;
  }

  async recipeExists(recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async leftoverAvailable(userId: number, leftoverBatchId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ leftover_id: number }[]>(Prisma.sql`SELECT leftover_id FROM leftover_batches WHERE leftover_id = ${leftoverBatchId} AND user_id = ${userId} AND recipe_id = ${recipeId} AND remaining_servings > 0 AND expires_at > CURRENT_TIMESTAMP`);
    return rows.length > 0;
  }

  async leftoverStartContext(userId: number, recipeId: number, leftoverBatchId: number, mealPlanItemId: number | null, householdId: number | null) {
    const rows = await this.prisma.$queryRaw<Array<{ mode: 'direct' | 'reserved'; available_servings: number; leftover_batch_id: number }>>(Prisma.sql`
      SELECT CASE WHEN i.item_id IS NULL THEN 'direct' ELSE 'reserved' END AS mode,
        CASE WHEN i.item_id IS NULL THEN b.remaining_servings ELSE i.servings END AS available_servings,
        b.leftover_id AS leftover_batch_id
      FROM leftover_batches b
      LEFT JOIN meal_plan_items i ON i.item_id = ${mealPlanItemId} AND i.source_type = 'leftover' AND i.leftover_batch_id = b.leftover_id AND i.recipe_id = ${recipeId}
      LEFT JOIN meal_plans p ON p.plan_id = i.plan_id
      WHERE b.leftover_id = ${leftoverBatchId} AND b.recipe_id = ${recipeId}
        AND ((i.item_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cooking_history h WHERE h.meal_plan_item_id = i.item_id)
              AND (p.user_id = ${userId} OR p.household_id = ${householdId}))
          OR (i.item_id IS NULL AND ${mealPlanItemId} IS NULL AND b.expires_at > CURRENT_TIMESTAMP AND b.remaining_servings > 0
              AND (b.user_id = ${userId} OR b.household_id = ${householdId})))
      LIMIT 1`);
    return rows[0] ?? null;
  }

  async mealPlanItemBelongsToHousehold(householdId: number, mealPlanItemId: number, recipeId: number) {
    const rows = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`SELECT i.item_id FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id WHERE i.item_id = ${mealPlanItemId} AND i.recipe_id = ${recipeId} AND i.source_type = 'recipe' AND p.household_id = ${householdId}`);
    return rows.length > 0;
  }

  async mealPlanItemBelongsToUser(userId: number, mealPlanItemId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
      SELECT i.item_id
      FROM meal_plan_items i
      JOIN meal_plans p ON p.plan_id = i.plan_id
      WHERE i.item_id = ${mealPlanItemId}
        AND i.recipe_id = ${recipeId}
        AND i.source_type = 'recipe'
        AND p.user_id = ${userId}
    `);
    return rows.length > 0;
  }

  private async findById(userId: number, sessionId: number): Promise<CookingSessionRecord | null> {
    const rows = await this.prisma.$queryRaw<CookingSessionRecord[]>(Prisma.sql`
      SELECT ${sessionProjection}
      FROM cooking_sessions s
      JOIN recipes r ON r.recipe_id = s.recipe_id
      LEFT JOIN meal_plan_items i ON i.item_id = s.meal_plan_item_id
      WHERE s.user_id = ${userId} AND s.session_id = ${sessionId}
    `);
    return rows[0] ?? null;
  }

  private toSessionRecord(row: CookingSessionRecord): CookingSessionRecord {
    return {
      session_id: row.session_id,
      user_id: row.user_id,
      recipe_id: row.recipe_id,
      recipe_name: row.recipe_name,
      meal_plan_item_id: row.meal_plan_item_id,
      source_type: row.source_type ?? 'recipe',
      leftover_batch_id: row.leftover_batch_id ?? null,
      planned_date: row.planned_date,
      slot: row.slot,
      servings: row.servings,
      current_step: row.current_step,
      status: row.status,
      started_at: row.started_at,
      last_active_at: row.last_active_at,
      paused_at: row.paused_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private unitLabel(unit: string): string {
    const labels: Record<string, string> = {
      GRAM: 'g', KILOGRAM: 'kg', MILLILITER: 'ml', LITER: 'l',
      TEASPOON: 'tsp', TABLESPOON: 'tbsp', CUP: 'cup', PIECE: 'piece',
    };
    return labels[unit] ?? unit.toLowerCase();
  }
}
