import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CategoryRecord = {
  id: number;
  name: string;
  recipe_count: number;
};

export type MealRecord = {
  id: number;
  name: string;
  description: string | null;
  recipe_count: number;
};

export type CategoriesResult = { categories: CategoryRecord[] };
export type MealsResult = { meals: MealRecord[] };

export interface TaxonomyRepositoryPort {
  listCategories(): Promise<CategoriesResult>;
  listMeals(): Promise<MealsResult>;
}

// Keep counts as JSON numbers instead of leaking the PostgreSQL driver's bigint string.
const toSafeInteger = (value: number | bigint | string): number => Number(value);

@Injectable()
export class TaxonomyRepository implements TaxonomyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<CategoriesResult> {
    const rows = await this.prisma.$queryRaw<
      { id: number | bigint; name: string; recipe_count: number | bigint }[]
    >(Prisma.sql`
      SELECT
        c.category_id AS id,
        c.category_name AS name,
        COUNT(r.recipe_id)::int AS recipe_count
      FROM categories c
      JOIN recipes r ON c.category_id = r.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_id ASC
    `);

    return {
      categories: rows.map((row) => ({
        id: toSafeInteger(row.id),
        name: row.name,
        recipe_count: toSafeInteger(row.recipe_count),
      })),
    };
  }

  async listMeals(): Promise<MealsResult> {
    const rows = await this.prisma.$queryRaw<
      {
        id: number | bigint;
        name: string;
        description: string | null;
        recipe_count: number | bigint;
      }[]
    >(Prisma.sql`
      SELECT
        m.meal_id AS id,
        m.meal_name AS name,
        m.meal_description AS description,
        COUNT(r.recipe_id)::int AS recipe_count
      FROM meals m
      JOIN recipes r ON m.meal_id = r.meal_id
      GROUP BY m.meal_id, m.meal_name, m.meal_description
      ORDER BY m.meal_id ASC
    `);

    return {
      meals: rows.map((row) => ({
        id: toSafeInteger(row.id),
        name: row.name,
        description: row.description,
        recipe_count: toSafeInteger(row.recipe_count),
      })),
    };
  }
}
