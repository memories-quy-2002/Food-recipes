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

    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const offset = (page - 1) * limit;

    const countRows = await this.prisma.$queryRaw<{ total: number | bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM recipes r
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      WHERE ${Prisma.join(conditions, ' AND ')}
    `);
    const total = toSafeInteger(countRows[0]?.total ?? 0);

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

    const totalPages = Math.ceil(total / limit);
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
    return rows[0] ? toJsonSafeRecipe(rows[0]) : null;
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
    const recipe = await this.findById(rows[0].recipe_id);
    if (!recipe) throw new Error('Recipe was inserted but could not be read');
    return recipe;
  }

  async update(id: number, dto: UpdateRecipeDto): Promise<RecipeRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE recipes
      SET
        recipe_name = COALESCE(${dto.name ?? null}, recipe_name),
        recipe_description = COALESCE(${dto.description ?? null}, recipe_description),
        meal_id = COALESCE(${dto.mealId ?? null}, meal_id),
        category_id = COALESCE(${dto.categoryId ?? null}, category_id),
        prep_time_minutes = COALESCE(${dto.prepTimeMinutes ?? null}, prep_time_minutes),
        cook_time_minutes = COALESCE(${dto.cookTimeMinutes ?? null}, cook_time_minutes),
        prep_time = CASE
          WHEN ${dto.prepTimeMinutes ?? null} IS NULL THEN prep_time
          ELSE make_interval(mins => ${dto.prepTimeMinutes ?? null})
        END,
        cook_time = CASE
          WHEN ${dto.cookTimeMinutes ?? null} IS NULL THEN cook_time
          ELSE make_interval(mins => ${dto.cookTimeMinutes ?? null})
        END,
        ingredients = COALESCE(${dto.ingredients ?? null}, ingredients),
        instructions = COALESCE(${dto.instructions ?? null}, instructions),
        image_url = COALESCE(${dto.imageUrl ?? null}, image_url)
      WHERE recipe_id = ${id}
    `);
    const recipe = await this.findById(id);
    if (!recipe) throw new Error('Recipe not found after update');
    return recipe;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`DELETE FROM recipes WHERE recipe_id = ${id}`);
  }
}
