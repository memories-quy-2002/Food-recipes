import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MealPlanSlot } from './dto/add-meal-plan-item.dto';

export type MealPlanRecord = { plan_id: number; name: string; start_date: Date | string; end_date: Date | string; created_at: Date; updated_at: Date };
export type MealPlanItemRecord = { item_id: number; plan_id: number; recipe_id: number; recipe_name: string; planned_date: Date | string; slot: MealPlanSlot; servings: number; created_at: Date };
export type ShoppingListItemRecord = { item_id: number; label: string; quantity: string | null; source_recipe_id: number | null; source_recipe_name: string | null; checked: boolean; created_at: Date; updated_at: Date };

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
  recipeIngredients(recipeId: number): Promise<{ name: string; ingredients: string[] } | null>;
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
      SELECT i.item_id, i.plan_id, i.recipe_id, r.recipe_name, i.planned_date, i.slot, i.servings, i.created_at
      FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id JOIN recipes r ON r.recipe_id = i.recipe_id
      WHERE p.user_id = ${userId} AND i.plan_id = ${planId}
      ORDER BY i.planned_date ASC, CASE i.slot WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END, i.item_id ASC
    `);
  }

  async findPlanItem(userId: number, planId: number, itemId: number): Promise<MealPlanItemRecord | null> {
    const rows = await this.prisma.$queryRaw<MealPlanItemRecord[]>(Prisma.sql`
      SELECT i.item_id, i.plan_id, i.recipe_id, r.recipe_name, i.planned_date, i.slot, i.servings, i.created_at
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

  async recipeIngredients(recipeId: number): Promise<{ name: string; ingredients: string[] } | null> {
    const rows = await this.prisma.$queryRaw<{ name: string; ingredients: string[] }[]>(Prisma.sql`SELECT recipe_name AS name, ingredients FROM recipes WHERE recipe_id = ${recipeId}`);
    return rows[0] ?? null;
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
}
