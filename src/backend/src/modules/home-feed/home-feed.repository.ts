import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
};

export interface HomeFeedRepositoryPort {
  listPopular(limit: number): Promise<HomeFeedRecipe[]>;
  listQuick(limit: number): Promise<HomeFeedRecipe[]>;
  listSaved(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listPlanned(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listFromPantry(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
  listRecommended(userId: number, limit: number): Promise<HomeFeedRecipe[]>;
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
