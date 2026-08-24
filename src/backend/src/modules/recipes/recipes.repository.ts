import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_LIMIT,
  DEFAULT_RECIPE_PAGE,
  MAX_RECIPE_PAGE,
  MAX_RECIPE_LIMIT,
  RecipeQueryDto,
  RecipeSort,
} from './dto/recipe-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import type { RecipeMetadataRecord } from '../recipe-metadata/recipe-metadata.repository';
import {
  RecipeIngredientDto,
  ReplaceRecipeNutritionDto,
  ReplaceRecipeTagsDto,
  RecipeStatus,
  RecipeStatusFilter,
} from './dto/recipe-structure.dto';
import { CreateRecipeDraftDto } from './dto/create-recipe-draft.dto';

export type RecipeIngredientRecord = {
  recipe_ingredient_id: number;
  ingredient_id?: number;
  recipe_id?: number;
  position: number;
  quantity: number | null;
  quantity_text: string | null;
  unit: string | null;
  unit_text?: string | null;
  name: string;
  preparation: string | null;
  original_text: string | null;
  note?: string | null;
};

export type RecipeNutritionRecord = {
  servings: number;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  calories_per_serving?: number | null;
  protein_grams?: number | null;
  carbohydrates_grams?: number | null;
  fat_grams?: number | null;
  fiber_grams?: number | null;
  sugar_grams?: number | null;
  sodium_milligrams?: number | null;
  source?: string;
  source_reference?: string | null;
};

export type RecipeRecord = {
  recipe_id: number;
  recipe_name: string | null;
  recipe_description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  date_added: Date | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  user_id: number;
  status: RecipeStatus;
  published_at: Date | null;
  archived_at: Date | null;
  updated_at: Date;
  structured_ingredients: RecipeIngredientRecord[];
  nutrition: RecipeNutritionRecord | null;
  dietary_tags: string[];
  allergen_tags: string[];
  metadata?: RecipeMetadataRecord;
  full_name?: string | null;
  meal_id?: number | null;
  meal_name?: string | null;
  meal_description?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  overall_score?: number;
  num_ratings?: number;
};

export type RecipePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
};

export type RecipeListResult = {
  recipes: RecipeRecord[];
  pagination: RecipePagination;
};

export interface RecipesRepositoryPort {
  list(query: RecipeQueryDto): Promise<RecipeListResult>;
  findById(id: number): Promise<RecipeRecord | null>;
  findByIdForOwner(id: number): Promise<RecipeRecord | null>;
  findByUserId(userId: number, status?: RecipeStatusFilter): Promise<RecipeRecord[]>;
  create(userId: number, dto: CreateRecipeDto): Promise<RecipeRecord>;
  createDraft(userId: number, dto: CreateRecipeDraftDto): Promise<RecipeRecord>;
  update(id: number, dto: UpdateRecipeDto): Promise<RecipeRecord>;
  replaceIngredients(id: number, ingredients: RecipeIngredientDto[]): Promise<RecipeRecord>;
  replaceNutrition(id: number, nutrition: ReplaceRecipeNutritionDto | null): Promise<RecipeRecord>;
  replaceTags(id: number, tags: ReplaceRecipeTagsDto): Promise<RecipeRecord>;
  publish(id: number): Promise<RecipeRecord>;
  archive(id: number): Promise<RecipeRecord>;
  restore(id: number): Promise<RecipeRecord>;
  delete(id: number): Promise<void>;
}

export const recipeOrderBySql = (sort: RecipeSort = 'popular'): string => {
  switch (sort) {
    case 'rating':
      return 'overall_score DESC, num_ratings DESC, r.recipe_id ASC';
    case 'name':
      return 'LOWER(r.recipe_name) ASC, r.recipe_name ASC, r.recipe_id ASC';
    case 'popular':
    default:
      return 'num_ratings DESC, overall_score DESC, r.recipe_id ASC';
  }
};

const toSafeInteger = (value: number | bigint): number => Number(value);

const toJsonSafeRecipe = (recipe: RecipeRecord): RecipeRecord => {
  const safeRecipe = { ...recipe };
  safeRecipe.recipe_id = toSafeInteger(recipe.recipe_id);
  if (recipe.prep_time_minutes !== null) {
    safeRecipe.prep_time_minutes = toSafeInteger(recipe.prep_time_minutes);
  }
  if (recipe.cook_time_minutes !== null) {
    safeRecipe.cook_time_minutes = toSafeInteger(recipe.cook_time_minutes);
  }
  if (recipe.total_time_minutes !== null) {
    safeRecipe.total_time_minutes = toSafeInteger(recipe.total_time_minutes);
  }
  safeRecipe.user_id = toSafeInteger(recipe.user_id);
  if (recipe.meal_id !== undefined && recipe.meal_id !== null) {
    safeRecipe.meal_id = toSafeInteger(recipe.meal_id);
  }
  if (recipe.category_id !== undefined && recipe.category_id !== null) {
    safeRecipe.category_id = toSafeInteger(recipe.category_id);
  }
  if (recipe.overall_score !== undefined) {
    safeRecipe.overall_score = Number(recipe.overall_score);
  }
  if (recipe.num_ratings !== undefined) {
    safeRecipe.num_ratings = toSafeInteger(recipe.num_ratings);
  }
  return safeRecipe;
};

const recipeMetadataSql = Prisma.sql`
  (SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'recipe_ingredient_id', ri.recipe_ingredient_id,
    'ingredient_id', ri.ingredient_id,
    'recipe_id', ri.recipe_id,
    'position', ri.position,
    'quantity', ri.quantity,
    'quantity_text', ri.quantity_text,
    'unit', COALESCE(ri.unit_text, ri.unit),
    'name', ri.name,
    'preparation', ri.preparation,
    'original_text', ri.original_text,
    'note', ri.note
  ) ORDER BY ri.position), '[]'::jsonb)
   FROM recipe_ingredients ri WHERE ri.recipe_id = r.recipe_id) AS structured_ingredients,
  (SELECT jsonb_build_object(
    'servings', rn.servings,
    'calories', rn.calories_per_serving,
    'protein', rn.protein_grams,
    'carbohydrates', rn.carbohydrates_grams,
    'fat', rn.fat_grams,
    'fiber', rn.fiber_grams,
    'sugar', rn.sugar_grams,
    'sodium', rn.sodium_milligrams,
    'source', rn.source,
    'source_reference', rn.source_reference
  ) FROM recipe_nutrition rn WHERE rn.recipe_id = r.recipe_id) AS nutrition,
  (SELECT COALESCE(jsonb_agg(rdt.tag ORDER BY rdt.tag), '[]'::jsonb)
   FROM recipe_dietary_tags rdt WHERE rdt.recipe_id = r.recipe_id) AS dietary_tags,
  (SELECT COALESCE(jsonb_agg(ra.name ORDER BY ra.name), '[]'::jsonb)
   FROM recipe_allergens ra WHERE ra.recipe_id = r.recipe_id) AS allergen_tags
`;

const statusCondition = (status: RecipeStatusFilter | undefined): Prisma.Sql =>
  !status || status === 'all'
    ? Prisma.sql`1 = 1`
    : Prisma.sql`r.status = ${status}`;

const normalizePage = (page: number | undefined): number =>
  Number.isSafeInteger(page) && (page as number) >= 1
    ? Math.min(page as number, MAX_RECIPE_PAGE)
    : DEFAULT_RECIPE_PAGE;

const normalizeLimit = (limit: number | undefined): number =>
  Number.isInteger(limit) && (limit as number) >= 1
    ? Math.min(limit as number, MAX_RECIPE_LIMIT)
    : DEFAULT_RECIPE_LIMIT;

const CANONICAL_UNITS = new Set([
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
  'TEASPOON',
  'TABLESPOON',
  'CUP',
  'PIECE',
]);

const normalizeUnit = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const upper = normalized.toUpperCase();
  const aliases: Record<string, string> = {
    G: 'GRAM',
    KG: 'KILOGRAM',
    ML: 'MILLILITER',
    L: 'LITER',
    TSP: 'TEASPOON',
    TBSP: 'TABLESPOON',
  };
  return aliases[upper] ?? (CANONICAL_UNITS.has(upper) ? upper : null);
};

type StructuredIngredientInput = RecipeIngredientDto & {
  note?: string | null;
};

@Injectable()
export class RecipesRepository implements RecipesRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: RecipeQueryDto): Promise<RecipeListResult> {
    const conditions: Prisma.Sql[] = [Prisma.sql`r.status = 'published'`];
    const searchTerm = query.q?.trim() || query.search?.trim();
    if (searchTerm) {
      const search = `%${searchTerm}%`;
      conditions.push(
        Prisma.sql`(r.recipe_name ILIKE ${search} OR r.recipe_description ILIKE ${search})`,
      );
    }
    if (query.categoryId) conditions.push(Prisma.sql`r.category_id = ${query.categoryId}`);
    if (query.mealId) conditions.push(Prisma.sql`r.meal_id = ${query.mealId}`);

    const requestedPage = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const countRows = await this.prisma.$queryRaw<{ total: number | bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      WHERE ${Prisma.join(conditions, ' AND ')}
    `);
    const total = toSafeInteger(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

    const rows = await this.prisma.$queryRaw<RecipeRecord[]>(Prisma.sql`
      SELECT
        r.recipe_id,
        r.recipe_name,
        r.recipe_description,
        r.date_added,
        r.image_url,
        r.ingredients,
        r.instructions,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        r.user_id,
        r.status,
        r.published_at,
        r.archived_at,
        r.updated_at,
        m.meal_id,
        m.meal_name,
        m.meal_description,
        c.category_id,
        c.category_name,
        COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
        COALESCE(COUNT(rt.rating_id), 0)::int AS num_ratings,
        ${recipeMetadataSql}
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY r.recipe_id, m.meal_id, c.category_id
      ORDER BY ${Prisma.raw(recipeOrderBySql(query.sort))}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return {
      recipes: rows.map(toJsonSafeRecipe),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
      },
    };
  }

  async findById(id: number): Promise<RecipeRecord | null> {
    return this.findByIdWithVisibility(id, true);
  }

  async findByIdForOwner(id: number): Promise<RecipeRecord | null> {
    return this.findByIdWithVisibility(id, false);
  }

  private async findByIdWithVisibility(
    id: number,
    publishedOnly: boolean,
  ): Promise<RecipeRecord | null> {
    const rows = await this.prisma.$queryRaw<RecipeRecord[]>(Prisma.sql`
      SELECT
        r.recipe_id,
        r.recipe_name,
        r.recipe_description,
        r.date_added,
        r.image_url,
        r.ingredients,
        r.instructions,
        r.user_id,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        r.status,
        r.published_at,
        r.archived_at,
        r.updated_at,
        a.full_name,
        m.meal_id,
        m.meal_name,
        c.category_id,
        c.category_name,
        COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
        COALESCE(COUNT(rt.rating_id), 0)::int AS num_ratings,
        ${recipeMetadataSql}
      FROM recipes r
      LEFT JOIN meals m ON m.meal_id = r.meal_id
      LEFT JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      LEFT JOIN accounts a ON a.user_id = r.user_id
      WHERE r.recipe_id = ${id}
        ${publishedOnly ? Prisma.sql`AND r.status = 'published'` : Prisma.empty}
      GROUP BY r.recipe_id, a.full_name, m.meal_id, c.category_id
    `);
    return rows[0] ? toJsonSafeRecipe(rows[0]) : null;
  }

  async findByUserId(
    userId: number,
    status: RecipeStatusFilter = 'all',
  ): Promise<RecipeRecord[]> {
    const rows = await this.prisma.$queryRaw<RecipeRecord[]>(Prisma.sql`
      SELECT
        r.recipe_id,
        r.recipe_name,
        r.recipe_description,
        r.date_added,
        r.image_url,
        r.ingredients,
        r.instructions,
        r.user_id,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        r.status,
        r.published_at,
        r.archived_at,
        r.updated_at,
        m.meal_id,
        m.meal_name,
        m.meal_description,
        c.category_id,
        c.category_name,
        ${recipeMetadataSql}
      FROM recipes r
      LEFT JOIN meals m ON m.meal_id = r.meal_id
      LEFT JOIN categories c ON c.category_id = r.category_id
      WHERE r.user_id = ${userId}
        AND ${statusCondition(status)}
      ORDER BY r.recipe_id ASC
    `);
    return rows.map(toJsonSafeRecipe);
  }

  async create(userId: number, dto: CreateRecipeDto): Promise<RecipeRecord> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      INSERT INTO recipes (
        recipe_name, recipe_description, meal_id, category_id,
        prep_time_minutes, cook_time_minutes, prep_time, cook_time,
        ingredients, instructions, user_id, image_url, status, published_at
      ) VALUES (
        ${dto.name}, ${dto.description ?? null}, ${dto.mealId}, ${dto.categoryId},
        ${dto.prepTimeMinutes}, ${dto.cookTimeMinutes},
        make_interval(mins => ${dto.prepTimeMinutes}),
        make_interval(mins => ${dto.cookTimeMinutes}),
        ${dto.ingredients ?? []}, ${dto.instructions ?? []}, ${userId},
        ${dto.imageUrl?.trim() || null}, 'published', CURRENT_TIMESTAMP
      )
      RETURNING recipe_id
    `);
    if (dto.structuredIngredients !== undefined) {
      await this.replaceStructuredIngredients(rows[0].recipe_id, dto.structuredIngredients);
    }
    const recipe = await this.findByIdForOwner(rows[0].recipe_id);
    if (!recipe) throw new Error('Recipe was inserted but could not be read');
    return recipe;
  }

  async createDraft(userId: number, dto: CreateRecipeDraftDto): Promise<RecipeRecord> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      INSERT INTO recipes (
        recipe_name, recipe_description, meal_id, category_id,
        prep_time_minutes, cook_time_minutes, prep_time, cook_time,
        ingredients, instructions, user_id, image_url, status
      ) VALUES (
        ${dto.name?.trim() || null}, ${dto.description ?? null}, ${dto.mealId ?? null},
        ${dto.categoryId ?? null}, ${dto.prepTimeMinutes ?? null}, ${dto.cookTimeMinutes ?? null},
        ${dto.prepTimeMinutes === undefined ? null : Prisma.sql`make_interval(mins => ${dto.prepTimeMinutes})`},
        ${dto.cookTimeMinutes === undefined ? null : Prisma.sql`make_interval(mins => ${dto.cookTimeMinutes})`},
        ${dto.ingredients ?? []}, ${dto.instructions ?? []}, ${userId},
        ${dto.imageUrl?.trim() || null}, 'draft'
      )
      RETURNING recipe_id
    `);
    const recipe = await this.findByIdForOwner(rows[0].recipe_id);
    if (!recipe) throw new Error('Draft was inserted but could not be read');
    return recipe;
  }

  async update(id: number, dto: UpdateRecipeDto): Promise<RecipeRecord> {
    const updates: Prisma.Sql[] = [];

    if (dto.name !== undefined) updates.push(Prisma.sql`recipe_name = ${dto.name.trim()}`);
    if (dto.description !== undefined) {
      updates.push(Prisma.sql`recipe_description = ${dto.description}`);
    }
    if (dto.mealId !== undefined) updates.push(Prisma.sql`meal_id = ${dto.mealId}`);
    if (dto.categoryId !== undefined) {
      updates.push(Prisma.sql`category_id = ${dto.categoryId}`);
    }
    if (dto.prepTimeMinutes !== undefined) {
      updates.push(Prisma.sql`prep_time_minutes = ${dto.prepTimeMinutes}`);
      updates.push(
        Prisma.sql`prep_time = make_interval(mins => ${dto.prepTimeMinutes})`,
      );
    }
    if (dto.cookTimeMinutes !== undefined) {
      updates.push(Prisma.sql`cook_time_minutes = ${dto.cookTimeMinutes}`);
      updates.push(
        Prisma.sql`cook_time = make_interval(mins => ${dto.cookTimeMinutes})`,
      );
    }
    if (dto.ingredients !== undefined) {
      updates.push(Prisma.sql`ingredients = ${dto.ingredients}`);
    }
    if (dto.instructions !== undefined) {
      updates.push(Prisma.sql`instructions = ${dto.instructions}`);
    }
    if (dto.imageUrl !== undefined) updates.push(Prisma.sql`image_url = ${dto.imageUrl}`);

    if (dto.structuredIngredients !== undefined) {
      await this.replaceStructuredIngredients(id, dto.structuredIngredients);
    }

    updates.push(Prisma.sql`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 0) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE recipes
        SET ${Prisma.join(updates, ', ')}
        WHERE recipe_id = ${id}
      `);
    }
    const recipe = await this.findByIdForOwner(id);
    if (!recipe) throw new Error('Recipe not found after update');
    return recipe;
  }

  async replaceIngredients(id: number, ingredients: RecipeIngredientDto[]): Promise<RecipeRecord> {
    await this.replaceStructuredIngredients(id, ingredients);
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after ingredient replacement');
      return recipe;
    });
  }

  private async replaceStructuredIngredients(
    id: number,
    ingredients: StructuredIngredientInput[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`DELETE FROM recipe_ingredients WHERE recipe_id = ${id}`);
      for (const [index, ingredient] of ingredients.entries()) {
        const unitText = ingredient.unit?.trim() || null;
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO recipe_ingredients (
            recipe_id, position, quantity, quantity_text, unit, unit_text, name,
            preparation, original_text, note
          ) VALUES (
            ${id}, ${index + 1}, ${ingredient.quantity ?? null},
            ${ingredient.quantityText?.trim() || null}, ${normalizeUnit(unitText)},
            ${unitText}, ${ingredient.name.trim()}, ${ingredient.preparation?.trim() || null},
            ${ingredient.originalText?.trim() || null}, ${ingredient.note?.trim() || ingredient.preparation?.trim() || null}
          )
        `);
      }
      const legacyIngredients = ingredients.map((ingredient) =>
        ingredient.originalText?.trim() ||
        [
          ingredient.quantityText?.trim() ||
            (ingredient.quantity === undefined || ingredient.quantity === null
              ? ''
              : String(ingredient.quantity)),
          ingredient.unit?.trim() || '',
          ingredient.name.trim(),
          ingredient.preparation?.trim() || ingredient.note?.trim() || '',
        ]
          .filter(Boolean)
          .join(' '),
      );
      await tx.$executeRaw(Prisma.sql`
        UPDATE recipes
        SET ingredients = ${legacyIngredients}, updated_at = CURRENT_TIMESTAMP
        WHERE recipe_id = ${id}
      `);
    });
  }

  async replaceNutrition(
    id: number,
    nutrition: ReplaceRecipeNutritionDto | null,
  ): Promise<RecipeRecord> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`DELETE FROM recipe_nutrition WHERE recipe_id = ${id}`);
      if (nutrition) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO recipe_nutrition (
            recipe_id, servings, calories_per_serving, protein_grams, carbohydrates_grams,
            fat_grams, fiber_grams, sugar_grams, sodium_milligrams, source
          ) VALUES (
            ${id}, ${nutrition.servings ?? null}, ${nutrition.calories ?? null},
            ${nutrition.protein ?? null}, ${nutrition.carbohydrates ?? null},
            ${nutrition.fat ?? null}, ${nutrition.fiber ?? null}, ${nutrition.sugar ?? null},
            ${nutrition.sodium ?? null}, 'provided_by_author'
          )
        `);
      }
      await tx.$executeRaw(Prisma.sql`
        UPDATE recipes SET updated_at = CURRENT_TIMESTAMP WHERE recipe_id = ${id}
      `);
    });
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after nutrition replacement');
      return recipe;
    });
  }

  async replaceTags(id: number, tags: ReplaceRecipeTagsDto): Promise<RecipeRecord> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`DELETE FROM recipe_dietary_tags WHERE recipe_id = ${id}`);
      await tx.$executeRaw(Prisma.sql`DELETE FROM recipe_allergens WHERE recipe_id = ${id}`);
      for (const tag of tags.dietaryTags ?? []) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO recipe_dietary_tags (recipe_id, tag) VALUES (${id}, ${tag.trim()})
        `);
      }
      for (const tag of tags.allergenTags ?? []) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO recipe_allergens (recipe_id, name, source)
          VALUES (${id}, ${tag.trim()}, 'provided_by_author')
        `);
      }
      await tx.$executeRaw(Prisma.sql`
        UPDATE recipes SET updated_at = CURRENT_TIMESTAMP WHERE recipe_id = ${id}
      `);
    });
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after tag replacement');
      return recipe;
    });
  }

  async publish(id: number): Promise<RecipeRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE recipes
      SET status = 'published', published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
          archived_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = ${id}
    `);
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after publish');
      return recipe;
    });
  }

  async archive(id: number): Promise<RecipeRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE recipes
      SET status = 'archived', archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = ${id}
    `);
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after archive');
      return recipe;
    });
  }

  async restore(id: number): Promise<RecipeRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE recipes
      SET status = 'draft', published_at = NULL, archived_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = ${id}
    `);
    return this.findByIdForOwner(id).then((recipe) => {
      if (!recipe) throw new Error('Recipe not found after restore');
      return recipe;
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`DELETE FROM recipes WHERE recipe_id = ${id}`);
  }
}
