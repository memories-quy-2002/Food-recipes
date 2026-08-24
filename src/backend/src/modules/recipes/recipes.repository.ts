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
import type { IngredientUnit } from './dto/structured-ingredient.dto';

export type StructuredIngredientRecord = {
  ingredient_id: number;
  recipe_id: number;
  name: string;
  quantity: number | null;
  unit: IngredientUnit | null;
  note: string | null;
  position: number;
};

export type RecipeRecord = {
  recipe_id: number;
  recipe_name: string;
  recipe_description: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  date_added: Date | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  user_id: number;
  full_name?: string | null;
  meal_id?: number;
  meal_name?: string;
  meal_description?: string | null;
  category_id?: number;
  category_name?: string;
  overall_score?: number;
  num_ratings?: number;
  structured_ingredients?: StructuredIngredientRecord[];
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
  findByUserId(userId: number): Promise<RecipeRecord[]>;
  create(userId: number, dto: CreateRecipeDto): Promise<RecipeRecord>;
  update(id: number, dto: UpdateRecipeDto): Promise<RecipeRecord>;
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
  safeRecipe.prep_time_minutes = toSafeInteger(recipe.prep_time_minutes);
  safeRecipe.cook_time_minutes = toSafeInteger(recipe.cook_time_minutes);
  safeRecipe.total_time_minutes = toSafeInteger(recipe.total_time_minutes);
  safeRecipe.user_id = toSafeInteger(recipe.user_id);
  if (recipe.meal_id !== undefined) safeRecipe.meal_id = toSafeInteger(recipe.meal_id);
  if (recipe.category_id !== undefined) {
    safeRecipe.category_id = toSafeInteger(recipe.category_id);
  }
  if (recipe.overall_score !== undefined) {
    safeRecipe.overall_score = Number(recipe.overall_score);
  }
  if (recipe.num_ratings !== undefined) {
    safeRecipe.num_ratings = toSafeInteger(recipe.num_ratings);
  }
  if (recipe.structured_ingredients) {
    safeRecipe.structured_ingredients = recipe.structured_ingredients.map((ingredient) => ({
      ...ingredient,
      ingredient_id: toSafeInteger(ingredient.ingredient_id),
      recipe_id: toSafeInteger(ingredient.recipe_id),
      quantity: ingredient.quantity === null ? null : Number(ingredient.quantity),
      position: toSafeInteger(ingredient.position),
    }));
  }
  return safeRecipe;
};

const normalizePage = (page: number | undefined): number =>
  Number.isSafeInteger(page) && (page as number) >= 1
    ? Math.min(page as number, MAX_RECIPE_PAGE)
    : DEFAULT_RECIPE_PAGE;

const normalizeLimit = (limit: number | undefined): number =>
  Number.isInteger(limit) && (limit as number) >= 1
    ? Math.min(limit as number, MAX_RECIPE_LIMIT)
    : DEFAULT_RECIPE_LIMIT;

@Injectable()
export class RecipesRepository implements RecipesRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: RecipeQueryDto): Promise<RecipeListResult> {
    const conditions: Prisma.Sql[] = [Prisma.sql`1 = 1`];
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
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        r.user_id,
        m.meal_id,
        m.meal_name,
        m.meal_description,
        c.category_id,
        c.category_name,
        COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
        COALESCE(COUNT(rt.rating_id), 0)::int AS num_ratings
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
        a.full_name,
        m.meal_id,
        m.meal_name,
        c.category_id,
        c.category_name,
        COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
        COALESCE(COUNT(rt.rating_id), 0)::int AS num_ratings
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      LEFT JOIN accounts a ON a.user_id = r.user_id
      WHERE r.recipe_id = ${id}
      GROUP BY r.recipe_id, a.full_name, m.meal_id, c.category_id
    `);
    if (!rows[0]) return null;
    const recipe = toJsonSafeRecipe(rows[0]);
    recipe.structured_ingredients = await this.listStructuredIngredients(id);
    return recipe;
  }

  private async listStructuredIngredients(recipeId: number): Promise<StructuredIngredientRecord[]> {
    const rows = await this.prisma.$queryRaw<StructuredIngredientRecord[]>(Prisma.sql`
      SELECT ingredient_id, recipe_id, name, quantity, unit, note, position
      FROM recipe_ingredients
      WHERE recipe_id = ${recipeId}
      ORDER BY position ASC, ingredient_id ASC
    `);
    return (rows ?? []).map((ingredient) => ({
      ingredient_id: Number(ingredient.ingredient_id),
      recipe_id: Number(ingredient.recipe_id),
      name: String(ingredient.name ?? ''),
      quantity: ingredient.quantity === null ? null : Number(ingredient.quantity),
      unit: ingredient.unit ?? null,
      note: ingredient.note ?? null,
      position: Number(ingredient.position),
    }));
  }

  private async replaceStructuredIngredients(recipeId: number, ingredients: NonNullable<CreateRecipeDto['structuredIngredients']>): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`DELETE FROM recipe_ingredients WHERE recipe_id = ${recipeId}`);
    for (const [position, ingredient] of ingredients.entries()) {
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, note, position)
        VALUES (${recipeId}, ${ingredient.name.trim()}, ${ingredient.quantity ?? null}, ${ingredient.unit ?? null}, ${ingredient.note?.trim() || null}, ${position})
      `);
    }
  }

  async findByUserId(userId: number): Promise<RecipeRecord[]> {
    const rows = await this.prisma.$queryRaw<RecipeRecord[]>(Prisma.sql`
      SELECT
        r.recipe_id,
        r.recipe_name,
        r.recipe_description,
        r.date_added,
        r.image_url,
        r.user_id,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.prep_time_minutes + r.cook_time_minutes AS total_time_minutes,
        m.meal_id,
        m.meal_name,
        m.meal_description,
        c.category_id,
        c.category_name
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      WHERE r.user_id = ${userId}
      ORDER BY r.recipe_id ASC
    `);
    return rows.map(toJsonSafeRecipe);
  }

  async create(userId: number, dto: CreateRecipeDto): Promise<RecipeRecord> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      INSERT INTO recipes (
        recipe_name, recipe_description, meal_id, category_id,
        prep_time_minutes, cook_time_minutes, prep_time, cook_time,
        ingredients, instructions, user_id, image_url
      ) VALUES (
        ${dto.name}, ${dto.description ?? null}, ${dto.mealId}, ${dto.categoryId},
        ${dto.prepTimeMinutes}, ${dto.cookTimeMinutes},
        make_interval(mins => ${dto.prepTimeMinutes}),
        make_interval(mins => ${dto.cookTimeMinutes}),
        ${dto.ingredients ?? []}, ${dto.instructions ?? []}, ${userId},
        ${dto.imageUrl?.trim() || null}
      )
      RETURNING recipe_id
    `);
    if (dto.structuredIngredients !== undefined) {
      await this.replaceStructuredIngredients(rows[0].recipe_id, dto.structuredIngredients);
    }
    const recipe = await this.findById(rows[0].recipe_id);
    if (!recipe) throw new Error('Recipe was inserted but could not be read');
    return recipe;
  }

  async update(id: number, dto: UpdateRecipeDto): Promise<RecipeRecord> {
    const updates: Prisma.Sql[] = [];

    if (dto.name !== undefined) updates.push(Prisma.sql`recipe_name = ${dto.name}`);
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

    if (updates.length > 0) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE recipes
        SET ${Prisma.join(updates, ', ')}
        WHERE recipe_id = ${id}
      `);
    }
    if (dto.structuredIngredients !== undefined) {
      await this.replaceStructuredIngredients(id, dto.structuredIngredients);
    }
    const recipe = await this.findById(id);
    if (!recipe) throw new Error('Recipe not found after update');
    return recipe;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`DELETE FROM recipes WHERE recipe_id = ${id}`);
  }
}
