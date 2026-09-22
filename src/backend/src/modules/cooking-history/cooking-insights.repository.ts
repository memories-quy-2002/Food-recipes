import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CookingRecapRecord = {
  completed_cooks: number;
  unique_recipes: number;
  most_cooked: { recipe_id: number; recipe_name: string; cook_count: number } | null;
};

export type RecipeCookingMemoryRecord = {
  cook_count: number;
  latest_cook: {
    history_id: number;
    servings: number;
    completed_at: Date;
    journal: { rating: number | null; would_cook_again: boolean | null; notes: string | null } | null;
  } | null;
};

export interface CookingInsightsRepositoryPort {
  getRecap(userId: number): Promise<CookingRecapRecord>;
  getRecipeMemory(userId: number, recipeId: number): Promise<RecipeCookingMemoryRecord>;
}

export const COOKING_INSIGHTS_REPOSITORY = Symbol('COOKING_INSIGHTS_REPOSITORY');

@Injectable()
export class CookingInsightsRepository implements CookingInsightsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getRecap(userId: number): Promise<CookingRecapRecord> {
    const [summaryRows, mostCookedRows] = await Promise.all([
      this.prisma.$queryRaw<{ completed_cooks: number; unique_recipes: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS completed_cooks,
               COUNT(DISTINCT recipe_id)::int AS unique_recipes
        FROM cooking_history
        WHERE user_id = ${userId}
      `),
      this.prisma.$queryRaw<{ recipe_id: number; recipe_name: string; cook_count: number }[]>(Prisma.sql`
        SELECT h.recipe_id, r.recipe_name, COUNT(*)::int AS cook_count
        FROM cooking_history h
        JOIN recipes r ON r.recipe_id = h.recipe_id
        WHERE h.user_id = ${userId}
        GROUP BY h.recipe_id, r.recipe_name
        ORDER BY cook_count DESC, MAX(h.completed_at) DESC, h.recipe_id DESC
        LIMIT 1
      `),
    ]);

    const summary = summaryRows[0] ?? { completed_cooks: 0, unique_recipes: 0 };
    return { ...summary, most_cooked: mostCookedRows[0] ?? null };
  }

  async getRecipeMemory(userId: number, recipeId: number): Promise<RecipeCookingMemoryRecord> {
    const rows = await this.prisma.$queryRaw<Array<{
      cook_count: number;
      history_id: number;
      servings: number;
      completed_at: Date;
      journal_id: number | null;
      rating: number | null;
      would_cook_again: boolean | null;
      notes: string | null;
    }>>(Prisma.sql`
      SELECT COUNT(*) OVER()::int AS cook_count,
             h.history_id, h.servings, h.completed_at,
             j.journal_id, j.rating, j.would_cook_again, j.notes
      FROM cooking_history h
      LEFT JOIN cooking_journals j
        ON j.history_id = h.history_id AND j.user_id = h.user_id
      WHERE h.user_id = ${userId} AND h.recipe_id = ${recipeId}
      ORDER BY h.completed_at DESC, h.history_id DESC
      LIMIT 1
    `);

    const latest = rows[0];
    if (!latest) return { cook_count: 0, latest_cook: null };

    return {
      cook_count: latest.cook_count,
      latest_cook: {
        history_id: latest.history_id,
        servings: latest.servings,
        completed_at: latest.completed_at,
        journal: latest.journal_id === null
          ? null
          : {
              rating: latest.rating,
              would_cook_again: latest.would_cook_again,
              notes: latest.notes,
            },
      },
    };
  }
}
