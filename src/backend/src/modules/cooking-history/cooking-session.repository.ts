import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CookingSessionEditableStatus } from './dto/update-cooking-session.dto';

export type CookingSessionRecord = {
  session_id: number;
  user_id: number;
  recipe_id: number;
  recipe_name: string;
  meal_plan_item_id: number | null;
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
    planned_date: Date | string | null;
    slot: string | null;
    servings: number;
    started_at: Date;
    completed_at: Date;
    created_at: Date;
  };
};

export interface CookingSessionRepositoryPort {
  findActive(userId: number, recipeId?: number): Promise<CookingSessionRecord | null>;
  start(userId: number, recipeId: number, mealPlanItemId: number | null, servings: number | null): Promise<CookingSessionRecord>;
  update(userId: number, sessionId: number, currentStep?: number, status?: CookingSessionEditableStatus): Promise<CookingSessionRecord | null>;
  complete(userId: number, sessionId: number): Promise<CompletedCookingSessionResult | null>;
  abandon(userId: number, sessionId: number): Promise<boolean>;
  recipeExists(recipeId: number): Promise<boolean>;
  mealPlanItemBelongsToUser(userId: number, mealPlanItemId: number, recipeId: number): Promise<boolean>;
}

export const COOKING_SESSION_REPOSITORY = Symbol('COOKING_SESSION_REPOSITORY');

const sessionProjection = Prisma.sql`
  s.session_id, s.user_id, s.recipe_id, r.recipe_name,
  s.meal_plan_item_id, i.planned_date, i.slot, s.servings,
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
    servings: number | null,
  ): Promise<CookingSessionRecord> {
    const existing = await this.prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
      SELECT session_id
      FROM cooking_sessions
      WHERE user_id = ${userId}
        AND recipe_id = ${recipeId}
        AND status IN ('active', 'paused')
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

    const rows = await this.prisma.$queryRaw<{ session_id: number }[]>(Prisma.sql`
      INSERT INTO cooking_sessions (
        user_id, recipe_id, meal_plan_item_id, servings, current_step, status,
        started_at, last_active_at
      ) VALUES (
        ${userId}, ${recipeId}, ${mealPlanItemId}, COALESCE(${servings}, 1), 0,
        'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING session_id
    `);
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

  async complete(userId: number, sessionId: number): Promise<CompletedCookingSessionResult | null> {
    const rows = await this.prisma.$queryRaw<Array<CookingSessionRecord & {
      history_id: number;
      history_created_at: Date;
    }>>(Prisma.sql`
      WITH completed AS (
        UPDATE cooking_sessions
        SET status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ${sessionId}
          AND user_id = ${userId}
          AND status IN ('active', 'paused')
        RETURNING session_id, user_id, recipe_id, meal_plan_item_id, servings,
                  current_step, status, started_at, last_active_at, paused_at,
                  completed_at, created_at, updated_at
      ), inserted_history AS (
        INSERT INTO cooking_history (
          user_id, recipe_id, meal_plan_item_id, servings, started_at, completed_at
        )
        SELECT user_id, recipe_id, meal_plan_item_id, servings, started_at, completed_at
        FROM completed
        RETURNING history_id, user_id, recipe_id, meal_plan_item_id, servings,
                  started_at, completed_at, created_at
      )
      SELECT c.session_id, c.user_id, c.recipe_id, r.recipe_name,
             c.meal_plan_item_id, i.planned_date, i.slot, c.servings,
             c.current_step, c.status, c.started_at, c.last_active_at,
             c.paused_at, c.completed_at, c.created_at, c.updated_at,
             h.history_id, h.created_at AS history_created_at
      FROM completed c
      JOIN inserted_history h ON h.user_id = c.user_id AND h.recipe_id = c.recipe_id
        AND h.started_at = c.started_at AND h.completed_at = c.completed_at
      JOIN recipes r ON r.recipe_id = c.recipe_id
      LEFT JOIN meal_plan_items i ON i.item_id = c.meal_plan_item_id
    `);
    const row = rows[0];
    if (!row) return null;

    return {
      session: {
        session_id: row.session_id,
        user_id: row.user_id,
        recipe_id: row.recipe_id,
        recipe_name: row.recipe_name,
        meal_plan_item_id: row.meal_plan_item_id,
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
      },
      history: {
        history_id: row.history_id,
        user_id: row.user_id,
        recipe_id: row.recipe_id,
        recipe_name: row.recipe_name,
        meal_plan_item_id: row.meal_plan_item_id,
        planned_date: row.planned_date,
        slot: row.slot,
        servings: row.servings,
        started_at: row.started_at,
        completed_at: row.completed_at!,
        created_at: row.history_created_at,
      },
    };
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
}
