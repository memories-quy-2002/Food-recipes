import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CookingHistoryRecord = {
  history_id: number;
  user_id: number;
  recipe_id: number;
  recipe_name: string;
  meal_plan_item_id: number | null;
  planned_date: Date | string | null;
  slot: string | null;
  servings: number;
  started_at: Date;
  completed_at: Date;
  created_at: Date;
};

export interface CookingHistoryRepositoryPort {
  list(userId: number, limit: number): Promise<CookingHistoryRecord[]>;
  recipeExists(recipeId: number): Promise<boolean>;
  mealPlanItemBelongsToUser(userId: number, mealPlanItemId: number, recipeId: number): Promise<boolean>;
  create(userId: number, recipeId: number, mealPlanItemId: number | null, servings: number, startedAt: Date, completedAt: Date): Promise<CookingHistoryRecord>;
}

export const COOKING_HISTORY_REPOSITORY = Symbol('COOKING_HISTORY_REPOSITORY');

@Injectable()
export class CookingHistoryRepository implements CookingHistoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: number, limit: number): Promise<CookingHistoryRecord[]> {
    return this.prisma.$queryRaw<CookingHistoryRecord[]>(Prisma.sql`
      SELECT h.history_id, h.user_id, h.recipe_id, r.recipe_name,
             h.meal_plan_item_id, i.planned_date, i.slot, h.servings,
             h.started_at, h.completed_at, h.created_at
      FROM cooking_history h
      JOIN recipes r ON r.recipe_id = h.recipe_id
      LEFT JOIN meal_plan_items i ON i.item_id = h.meal_plan_item_id
      WHERE h.user_id = ${userId}
      ORDER BY h.completed_at DESC, h.history_id DESC
      LIMIT ${limit}
    `);
  }

  async recipeExists(recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async mealPlanItemBelongsToUser(userId: number, mealPlanItemId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ item_id: number }[]>(Prisma.sql`
      SELECT i.item_id
      FROM meal_plan_items i
      JOIN meal_plans p ON p.plan_id = i.plan_id
      WHERE i.item_id = ${mealPlanItemId}
        AND i.recipe_id = ${recipeId}
        AND p.user_id = ${userId}
    `);
    return rows.length > 0;
  }

  async create(userId: number, recipeId: number, mealPlanItemId: number | null, servings: number, startedAt: Date, completedAt: Date): Promise<CookingHistoryRecord> {
    const rows = await this.prisma.$queryRaw<{ history_id: number }[]>(Prisma.sql`
      INSERT INTO cooking_history (user_id, recipe_id, meal_plan_item_id, servings, started_at, completed_at)
      VALUES (${userId}, ${recipeId}, ${mealPlanItemId}, ${servings}, ${startedAt}, ${completedAt})
      RETURNING history_id
    `);
    return (await this.find(userId, rows[0].history_id))!;
  }

  private async find(userId: number, historyId: number): Promise<CookingHistoryRecord | null> {
    const rows = await this.prisma.$queryRaw<CookingHistoryRecord[]>(Prisma.sql`
      SELECT h.history_id, h.user_id, h.recipe_id, r.recipe_name,
             h.meal_plan_item_id, i.planned_date, i.slot, h.servings,
             h.started_at, h.completed_at, h.created_at
      FROM cooking_history h
      JOIN recipes r ON r.recipe_id = h.recipe_id
      LEFT JOIN meal_plan_items i ON i.item_id = h.meal_plan_item_id
      WHERE h.user_id = ${userId} AND h.history_id = ${historyId}
    `);
    return rows[0] ?? null;
  }
}
