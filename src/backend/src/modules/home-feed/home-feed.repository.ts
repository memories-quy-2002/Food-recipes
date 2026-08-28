import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type HomeFeedRecipe = {
  recipe_id: number;
  recipe_name: string;
  recipe_description: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  date_added: Date | null;
  image_url: string | null;
  user_id: number;
  meal_id: number;
  meal_name: string;
  meal_description: string | null;
  category_id: number;
  category_name: string;
  overall_score: number;
  num_ratings: number;
  dietary_tags: string[];
  pantry_match_count?: number;
  recommendation_score?: number;
  reasons?: string[];
};

export type KitchenActiveSession = {
  session_id: number;
  recipe_id: number;
  recipe_name: string;
  meal_plan_item_id: number | null;
  planned_date: Date | string | null;
  slot: string | null;
  servings: number;
  current_step: number;
  total_steps: number;
  status: 'active' | 'paused';
  updated_at: Date;
};

export type KitchenNextMeal = {
  item_id: number;
  plan_id: number;
  recipe_id: number;
  recipe_name: string;
  planned_date: Date | string;
  slot: string;
  servings: number;
};

export type KitchenState = {
  active_session: KitchenActiveSession | null;
  next_meal: KitchenNextMeal | null;
  shopping: { open_items: number; completed_items: number };
  pantry: { available_items: number };
  progress: { saved_recipes: number; planned_meals: number; completed_cooks: number };
};

export interface HomeFeedRepositoryPort {
  listPopular(limit: number): Promise<HomeFeedRecipe[]>;
  listQuick(limit: number): Promise<HomeFeedRecipe[]>;
  listSaved(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listPlanned(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listFromPantry(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listRecommended(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  findPublishedByIds(recipeIds: number[]): Promise<HomeFeedRecipe[]>;
  getKitchenState(userId: number): Promise<KitchenState>;
}

export const HOME_FEED_REPOSITORY = Symbol('HOME_FEED_REPOSITORY');

const recipeProjection = Prisma.sql`
  r.recipe_id,
  r.recipe_name,
  r.recipe_description,
  r.prep_time_minutes,
  r.cook_time_minutes,
  r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
  r.date_added,
  r.image_url,
  r.user_id,
  m.meal_id,
  m.meal_name,
  m.meal_description,
  c.category_id,
  c.category_name,
  COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
  COUNT(rt.rating_id)::int AS num_ratings,
  COALESCE((
    SELECT jsonb_agg(rdt.tag ORDER BY rdt.tag)
    FROM recipe_dietary_tags rdt
    WHERE rdt.recipe_id = r.recipe_id
  ), '[]'::jsonb) AS dietary_tags
`;

const recipeGroupBy = Prisma.sql`
  r.recipe_id, m.meal_id, c.category_id
`;

const normalizeRows = (rows: HomeFeedRecipe[]): HomeFeedRecipe[] =>
  rows.map((row) => ({
    ...row,
    recipe_id: Number(row.recipe_id),
    prep_time_minutes: Number(row.prep_time_minutes),
    cook_time_minutes: Number(row.cook_time_minutes),
    total_time_minutes: Number(row.total_time_minutes),
    user_id: Number(row.user_id),
    meal_id: Number(row.meal_id),
    category_id: Number(row.category_id),
    overall_score: Number(row.overall_score ?? 0),
    num_ratings: Number(row.num_ratings ?? 0),
    dietary_tags: Array.isArray(row.dietary_tags) ? row.dietary_tags : [],
    ...(row.pantry_match_count === undefined ? {} : { pantry_match_count: Number(row.pantry_match_count) }),
  }));

@Injectable()
export class HomeFeedRepository implements HomeFeedRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  listPopular(limit: number): Promise<HomeFeedRecipe[]> {
    return this.listCatalogRecipes(
      Prisma.sql`r.status = 'published'`,
      Prisma.sql`overall_score DESC, num_ratings DESC, r.date_added DESC NULLS LAST, r.recipe_id DESC`,
      limit,
    );
  }

  listQuick(limit: number): Promise<HomeFeedRecipe[]> {
    return this.listCatalogRecipes(
      Prisma.sql`r.status = 'published' AND r.prep_time_minutes + r.cook_time_minutes <= 45`,
      Prisma.sql`total_time_minutes ASC, overall_score DESC, num_ratings DESC, r.recipe_id DESC`,
      limit,
    );
  }

  async listSaved(userId: number, limit: number): Promise<HomeFeedRecipe[]> {
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}
      FROM wishlist w
      JOIN recipes r ON r.recipe_id = w.recipe_id
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE w.user_id = ${userId}
        AND r.status = 'published'
      GROUP BY w.wishlist_id, w.date_added, ${recipeGroupBy}
      ORDER BY w.date_added DESC NULLS LAST, w.wishlist_id DESC
      LIMIT ${limit}
    `);
    return normalizeRows(rows);
  }

  async listPlanned(userId: number, limit: number): Promise<HomeFeedRecipe[]> {
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}, MIN(plan_item.planned_date) AS next_planned_date
      FROM meal_plan_items plan_item
      JOIN meal_plans plan ON plan.plan_id = plan_item.plan_id
      JOIN recipes r ON r.recipe_id = plan_item.recipe_id
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE plan.user_id = ${userId}
        AND r.status = 'published'
        AND plan_item.planned_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
      GROUP BY ${recipeGroupBy}
      ORDER BY next_planned_date ASC, r.recipe_id ASC
      LIMIT ${limit}
    `);
    return normalizeRows(rows);
  }

  async listFromPantry(userId: number, limit: number): Promise<HomeFeedRecipe[]> {
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}, COUNT(DISTINCT pantry.pantry_id)::int AS pantry_match_count
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      LEFT JOIN pantry_items pantry
        ON pantry.user_id = ${userId}
        AND pantry.have = TRUE
        AND (pantry.quantity IS NULL OR pantry.quantity > 0)
        AND (
          EXISTS (
            SELECT 1
            FROM unnest(r.ingredients) AS legacy_ingredient
            WHERE LOWER(legacy_ingredient) LIKE '%' || LOWER(pantry.name) || '%'
          )
          OR EXISTS (
            SELECT 1
            FROM recipe_ingredients structured_ingredient
            WHERE structured_ingredient.recipe_id = r.recipe_id
              AND LOWER(structured_ingredient.name) LIKE '%' || LOWER(pantry.name) || '%'
          )
        )
      WHERE r.status = 'published'
        AND pantry.pantry_id IS NOT NULL
      GROUP BY ${recipeGroupBy}
      ORDER BY pantry_match_count DESC, overall_score DESC, total_time_minutes ASC, r.recipe_id DESC
      LIMIT ${limit}
    `);
    return normalizeRows(rows);
  }

  async listRecommended(userId: number, limit: number): Promise<HomeFeedRecipe[]> {
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE r.status = 'published'
        AND r.user_id <> ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM rating own_rating
          WHERE own_rating.user_id = ${userId} AND own_rating.recipe_id = r.recipe_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM wishlist saved_recipe
          WHERE saved_recipe.user_id = ${userId} AND saved_recipe.recipe_id = r.recipe_id
        )
        AND (
          EXISTS (
            SELECT 1
            FROM rating liked_rating
            JOIN recipes liked_recipe ON liked_recipe.recipe_id = liked_rating.recipe_id
            WHERE liked_rating.user_id = ${userId}
              AND liked_rating.score >= 4
              AND liked_recipe.category_id = r.category_id
          )
          OR EXISTS (
            SELECT 1
            FROM rating liked_rating
            JOIN recipes liked_recipe ON liked_recipe.recipe_id = liked_rating.recipe_id
            WHERE liked_rating.user_id = ${userId}
              AND liked_rating.score >= 4
              AND liked_recipe.meal_id = r.meal_id
          )
        )
      GROUP BY ${recipeGroupBy}
      ORDER BY (
        CASE WHEN EXISTS (
          SELECT 1
          FROM rating liked_rating
          JOIN recipes liked_recipe ON liked_recipe.recipe_id = liked_rating.recipe_id
          WHERE liked_rating.user_id = ${userId}
            AND liked_rating.score >= 4
            AND liked_recipe.category_id = r.category_id
        ) THEN 2 ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1
          FROM rating liked_rating
          JOIN recipes liked_recipe ON liked_recipe.recipe_id = liked_rating.recipe_id
          WHERE liked_rating.user_id = ${userId}
            AND liked_rating.score >= 4
            AND liked_recipe.meal_id = r.meal_id
        ) THEN 1 ELSE 0 END
      ) DESC,
      overall_score DESC,
      num_ratings DESC,
      r.recipe_id DESC
      LIMIT ${limit}
    `);
    return normalizeRows(rows);
  }

  async findPublishedByIds(recipeIds: number[]): Promise<HomeFeedRecipe[]> {
    if (!recipeIds.length) return [];
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE r.status = 'published'
        AND r.recipe_id IN (${Prisma.join(recipeIds)})
      GROUP BY ${recipeGroupBy}
    `);
    return normalizeRows(rows);
  }

  async getKitchenState(userId: number): Promise<KitchenState> {
    const [activeRows, nextMealRows, shoppingRows, pantryRows, progressRows] = await Promise.all([
      this.prisma.$queryRaw<KitchenActiveSession[]>(Prisma.sql`
        SELECT s.session_id, s.recipe_id, r.recipe_name, s.meal_plan_item_id,
               i.planned_date, i.slot, s.servings, s.current_step,
               GREATEST(COALESCE(array_length(r.instructions, 1), 0), 0)::int AS total_steps,
               s.status, s.updated_at
        FROM cooking_sessions s
        JOIN recipes r ON r.recipe_id = s.recipe_id
        LEFT JOIN meal_plan_items i ON i.item_id = s.meal_plan_item_id
        WHERE s.user_id = ${userId}
          AND s.status IN ('active', 'paused')
        ORDER BY s.updated_at DESC, s.session_id DESC
        LIMIT 1
      `),
      this.prisma.$queryRaw<KitchenNextMeal[]>(Prisma.sql`
        SELECT i.item_id, i.plan_id, i.recipe_id, r.recipe_name,
               i.planned_date, i.slot, i.servings
        FROM meal_plan_items i
        JOIN meal_plans p ON p.plan_id = i.plan_id
        JOIN recipes r ON r.recipe_id = i.recipe_id
        WHERE p.user_id = ${userId}
          AND r.status = 'published'
          AND i.planned_date >= CURRENT_DATE
        ORDER BY i.planned_date ASC,
                 CASE i.slot WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END,
                 i.item_id ASC
        LIMIT 1
      `),
      this.prisma.$queryRaw<{ open_items: number; completed_items: number }[]>(Prisma.sql`
        SELECT COUNT(*) FILTER (WHERE checked = FALSE)::int AS open_items,
               COUNT(*) FILTER (WHERE checked = TRUE)::int AS completed_items
        FROM shopping_list_items
        WHERE user_id = ${userId}
      `),
      this.prisma.$queryRaw<{ available_items: number }[]>(Prisma.sql`
        SELECT COUNT(*) FILTER (WHERE have = TRUE AND (quantity IS NULL OR quantity > 0))::int AS available_items
        FROM pantry_items
        WHERE user_id = ${userId}
      `),
      this.prisma.$queryRaw<{ saved_recipes: number; planned_meals: number; completed_cooks: number }[]>(Prisma.sql`
        SELECT
          (SELECT COUNT(*)::int FROM wishlist WHERE user_id = ${userId}) AS saved_recipes,
          (SELECT COUNT(*)::int
           FROM meal_plan_items i
           JOIN meal_plans p ON p.plan_id = i.plan_id
           WHERE p.user_id = ${userId} AND i.planned_date >= CURRENT_DATE) AS planned_meals,
          (SELECT COUNT(*)::int FROM cooking_history WHERE user_id = ${userId}) AS completed_cooks
      `),
    ]);

    const activeSession = activeRows[0];
    const shopping = shoppingRows[0] ?? { open_items: 0, completed_items: 0 };
    const pantry = pantryRows[0] ?? { available_items: 0 };
    const progress = progressRows[0] ?? { saved_recipes: 0, planned_meals: 0, completed_cooks: 0 };

    return {
      active_session: activeSession
        ? {
            ...activeSession,
            session_id: Number(activeSession.session_id),
            recipe_id: Number(activeSession.recipe_id),
            meal_plan_item_id: activeSession.meal_plan_item_id === null ? null : Number(activeSession.meal_plan_item_id),
            servings: Number(activeSession.servings),
            current_step: Number(activeSession.current_step),
            total_steps: Number(activeSession.total_steps),
          }
        : null,
      next_meal: nextMealRows[0]
        ? {
            ...nextMealRows[0],
            item_id: Number(nextMealRows[0].item_id),
            plan_id: Number(nextMealRows[0].plan_id),
            recipe_id: Number(nextMealRows[0].recipe_id),
            servings: Number(nextMealRows[0].servings),
          }
        : null,
      shopping: {
        open_items: Number(shopping.open_items),
        completed_items: Number(shopping.completed_items),
      },
      pantry: { available_items: Number(pantry.available_items) },
      progress: {
        saved_recipes: Number(progress.saved_recipes),
        planned_meals: Number(progress.planned_meals),
        completed_cooks: Number(progress.completed_cooks),
      },
    };
  }

  private async listCatalogRecipes(
    where: Prisma.Sql,
    orderBy: Prisma.Sql,
    limit: number,
  ): Promise<HomeFeedRecipe[]> {
    const rows = await this.prisma.$queryRaw<HomeFeedRecipe[]>(Prisma.sql`
      SELECT ${recipeProjection}
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE ${where}
      GROUP BY ${recipeGroupBy}
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `);
    return normalizeRows(rows);
  }
}
