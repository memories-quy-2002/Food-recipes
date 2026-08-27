import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type SuggestionResult = {
  recipe_id: number;
  recipe_name: string;
  recipe_description: string | null;
  image_url: string | null;
  match_score: number;
  reason: string;
};

export interface SuggestionsRepositoryPort {
  findByIngredients(ingredients: string[]): Promise<SuggestionResult[]>;
  findPersonalized(userId: number): Promise<SuggestionResult[]>;
  findForMealPlan(userId: number): Promise<SuggestionResult[]>;
  findBySubstituteIngredient(recipeId: number, ingredient: string): Promise<SuggestionResult[]>;
}

export const SUGGESTIONS_REPOSITORY = Symbol('SUGGESTIONS_REPOSITORY');

const normalizeRows = (rows: SuggestionResult[]): SuggestionResult[] =>
  rows.map((row) => ({
    ...row,
    recipe_id: Number(row.recipe_id),
    match_score: Number(row.match_score ?? 0),
  }));

const recipeProjection = Prisma.sql`
  r.recipe_id, r.recipe_name, r.recipe_description, r.image_url
`;

@Injectable()
export class SuggestionsRepository implements SuggestionsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIngredients(ingredients: string[]): Promise<SuggestionResult[]> {
    const terms = ingredients.map((ingredient) => `%${ingredient}%`);
    const matches = terms.map((term) => Prisma.sql`ingredient ILIKE ${term}`);
    const rows = await this.prisma.$queryRaw<SuggestionResult[]>(Prisma.sql`
      SELECT ${recipeProjection}, COUNT(DISTINCT ingredient)::int AS match_score, '' AS reason
      FROM recipes r
      CROSS JOIN LATERAL unnest(r.ingredients) AS ingredient
      WHERE ${Prisma.join(matches, ' OR ')}
      GROUP BY r.recipe_id
      ORDER BY match_score DESC, r.recipe_id ASC
      LIMIT 6
    `);
    return normalizeRows(rows);
  }

  async findPersonalized(userId: number): Promise<SuggestionResult[]> {
    const rows = await this.prisma.$queryRaw<SuggestionResult[]>(Prisma.sql`
      SELECT ${recipeProjection},
        1::int AS match_score,
        'Matches categories you have rated highly.' AS reason
      FROM recipes r
      WHERE EXISTS (
        SELECT 1
        FROM rating liked
        JOIN recipes liked_recipe ON liked_recipe.recipe_id = liked.recipe_id
        WHERE liked.user_id = ${userId}
          AND liked.score >= 4
          AND liked_recipe.category_id = r.category_id
      )
      ORDER BY r.recipe_id ASC
      LIMIT 6
    `);
    return normalizeRows(rows);
  }

  async findForMealPlan(userId: number): Promise<SuggestionResult[]> {
    const rows = await this.prisma.$queryRaw<SuggestionResult[]>(Prisma.sql`
      SELECT ${recipeProjection},
        1::int AS match_score,
        'Matches categories already used in your meal plan.' AS reason
      FROM recipes r
      WHERE EXISTS (
        SELECT 1
        FROM meal_plan_items planned_item
        JOIN meal_plans plan ON plan.plan_id = planned_item.plan_id
        JOIN recipes planned_recipe ON planned_recipe.recipe_id = planned_item.recipe_id
        WHERE plan.user_id = ${userId}
          AND planned_recipe.category_id = r.category_id
      )
      ORDER BY r.recipe_id ASC
      LIMIT 6
    `);
    return normalizeRows(rows);
  }

  async findBySubstituteIngredient(recipeId: number, ingredient: string): Promise<SuggestionResult[]> {
    const term = `%${ingredient}%`;
    const rows = await this.prisma.$queryRaw<SuggestionResult[]>(Prisma.sql`
      SELECT ${recipeProjection},
        1::int AS match_score,
        'Uses the requested ingredient in a related catalog recipe; verify suitability before substituting.' AS reason
      FROM recipes r
      WHERE r.recipe_id <> ${recipeId}
        AND EXISTS (
          SELECT 1 FROM recipes original
          WHERE original.recipe_id = ${recipeId}
            AND original.category_id = r.category_id
        )
        AND EXISTS (
          SELECT 1
          FROM unnest(r.ingredients) AS candidate
          WHERE candidate ILIKE ${term}
        )
      ORDER BY r.recipe_id ASC
      LIMIT 6
    `);
    return normalizeRows(rows);
  }
}
