import { Injectable } from '@nestjs/common';
import type { RecipeStatus } from '../recipes/dto/recipe-structure.dto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const RECOMMENDATION_CANDIDATE_LIMIT = 150;

export type RecommendationNutrition = {
  caloriesPerServing: number | null;
  proteinGrams: number | null;
  carbohydratesGrams?: number | null;
  fatGrams?: number | null;
  fiberGrams?: number | null;
  sugarGrams?: number | null;
  sodiumMilligrams?: number | null;
};

export type RecommendationStructuredIngredient = {
  name: string;
};

export type RecommendationCandidate = {
  recipeId: number;
  authorId: number;
  status: RecipeStatus;
  categoryId: number | null;
  mealId: number | null;
  categoryName?: string | null;
  mealName?: string | null;
  totalTimeMinutes: number | null;
  averageRating: number;
  ratingCount: number;
  nutrition: RecommendationNutrition | null;
  dietaryTags: string[];
  allergenTags: string[];
  structuredIngredients: RecommendationStructuredIngredient[];
  legacyIngredients: string[];
  cuisineTags?: string[];
};

type RecommendationCandidateRow = {
  recipe_id: number | bigint;
  author_id: number | bigint;
  status: string;
  category_id: number | bigint | null;
  meal_id: number | bigint | null;
  category_name: string | null;
  meal_name: string | null;
  total_time_minutes: number | string | null;
  average_rating: number | string | null;
  rating_count: number | bigint | string | null;
  nutrition: unknown;
  dietary_tags: unknown;
  allergen_tags: unknown;
  structured_ingredients: unknown;
  legacy_ingredients: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const toStringArray = (value: unknown): string[] => {
  const parsed = parseJson(value);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === 'string')
    : [];
};

const toStructuredIngredients = (value: unknown): RecommendationStructuredIngredient[] => {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) return [{ name: item }];
    const record = asRecord(item);
    return typeof record?.name === 'string' && record.name.trim()
      ? [{ name: record.name }]
      : [];
  });
};

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nutritionFrom = (value: unknown): RecommendationNutrition | null => {
  const record = asRecord(parseJson(value));
  if (!record) return null;
  return {
    caloriesPerServing: numberOrNull(record.caloriesPerServing ?? record.calories_per_serving),
    proteinGrams: numberOrNull(record.proteinGrams ?? record.protein_grams),
    carbohydratesGrams: numberOrNull(record.carbohydratesGrams ?? record.carbohydrates_grams),
    fatGrams: numberOrNull(record.fatGrams ?? record.fat_grams),
    fiberGrams: numberOrNull(record.fiberGrams ?? record.fiber_grams),
    sugarGrams: numberOrNull(record.sugarGrams ?? record.sugar_grams),
    sodiumMilligrams: numberOrNull(record.sodiumMilligrams ?? record.sodium_milligrams),
  };
};

const boundedLimit = (limit: number): number =>
  Number.isInteger(limit) && limit > 0
    ? Math.min(limit, RECOMMENDATION_CANDIDATE_LIMIT)
    : RECOMMENDATION_CANDIDATE_LIMIT;

@Injectable()
export class RecommendationCandidatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(limit = RECOMMENDATION_CANDIDATE_LIMIT): Promise<RecommendationCandidate[]> {
    const rows = await this.prisma.$queryRaw<RecommendationCandidateRow[]>(Prisma.sql`
      SELECT
        r.recipe_id,
        r.user_id AS author_id,
        r.status,
        r.category_id,
        r.meal_id,
        c.category_name,
        m.meal_name,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        COALESCE(ROUND(AVG(rt.score), 2), 0)::float8 AS average_rating,
        COUNT(rt.rating_id)::int AS rating_count,
        (
          SELECT jsonb_build_object(
            'caloriesPerServing', rn.calories_per_serving,
            'proteinGrams', rn.protein_grams,
            'carbohydratesGrams', rn.carbohydrates_grams,
            'fatGrams', rn.fat_grams,
            'fiberGrams', rn.fiber_grams,
            'sugarGrams', rn.sugar_grams,
            'sodiumMilligrams', rn.sodium_milligrams
          )
          FROM recipe_nutrition rn
          WHERE rn.recipe_id = r.recipe_id
        ) AS nutrition,
        COALESCE((
          SELECT jsonb_agg(rdt.tag ORDER BY rdt.tag)
          FROM recipe_dietary_tags rdt
          WHERE rdt.recipe_id = r.recipe_id
        ), '[]'::jsonb) AS dietary_tags,
        COALESCE((
          SELECT jsonb_agg(ra.name ORDER BY ra.name)
          FROM recipe_allergens ra
          WHERE ra.recipe_id = r.recipe_id
        ), '[]'::jsonb) AS allergen_tags,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object('name', ri.name)
            ORDER BY ri.position, ri.ingredient_id
          )
          FROM recipe_ingredients ri
          WHERE ri.recipe_id = r.recipe_id
        ), '[]'::jsonb) AS structured_ingredients,
        r.ingredients AS legacy_ingredients
      FROM recipes r
      LEFT JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN meals m ON m.meal_id = r.meal_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE r.status = 'published'
      GROUP BY r.recipe_id, c.category_name, m.meal_name
      ORDER BY average_rating DESC, rating_count DESC, r.recipe_id ASC
      LIMIT ${boundedLimit(limit)}
    `);

    return rows.map((row) => ({
      recipeId: Number(row.recipe_id),
      authorId: Number(row.author_id),
      status: row.status as RecipeStatus,
      categoryId: row.category_id === null ? null : Number(row.category_id),
      mealId: row.meal_id === null ? null : Number(row.meal_id),
      categoryName: row.category_name,
      mealName: row.meal_name,
      totalTimeMinutes: numberOrNull(row.total_time_minutes),
      averageRating: numberOrNull(row.average_rating) ?? 0,
      ratingCount: numberOrNull(row.rating_count) ?? 0,
      nutrition: nutritionFrom(row.nutrition),
      dietaryTags: toStringArray(row.dietary_tags),
      allergenTags: toStringArray(row.allergen_tags),
      structuredIngredients: toStructuredIngredients(row.structured_ingredients),
      legacyIngredients: toStringArray(row.legacy_ingredients),
    }));
  }
}

export interface RecommendationCandidatesRepositoryPort {
  listPublished(limit?: number): Promise<RecommendationCandidate[]>;
}

export const RECOMMENDATION_CANDIDATES_REPOSITORY = Symbol('RECOMMENDATION_CANDIDATES_REPOSITORY');
