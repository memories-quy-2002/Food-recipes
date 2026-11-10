import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WishlistQueryDto, WishlistSort } from './dto/wishlist-query.dto';

const DEFAULT_WISHLIST_PAGE = 1;
const DEFAULT_WISHLIST_LIMIT = 12;
const MAX_WISHLIST_PAGE = 1_000_000;
const MAX_WISHLIST_LIMIT = 100;

export type RecipeSummary = {
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
};

export type WishlistItem = {
  recipe: RecipeSummary;
  savedAt: string;
};

export type WishlistPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
};

export type WishlistListResult = {
  wishlist: WishlistItem[];
  pagination?: WishlistPagination;
};

type WishlistRow = {
  saved_at: Date | string;
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
};

export interface WishlistRepositoryPort {
  listByUserId(userId: number, query?: WishlistQueryDto): Promise<WishlistListResult>;
  add(userId: number, recipeId: number): Promise<WishlistItem | null>;
  remove(userId: number, recipeId: number): Promise<boolean>;
}

export const WISHLIST_REPOSITORY = Symbol('WISHLIST_REPOSITORY');

@Injectable()
export class WishlistRepository implements WishlistRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: number, query?: WishlistQueryDto): Promise<WishlistListResult> {
    const requested = query && Object.keys(query).length > 0;
    if (!requested) {
      return { wishlist: await this.findItems(Prisma.sql`w.user_id = ${userId}`) };
    }

    const search = query.search?.trim() || '';
    const searchWhere = search
      ? Prisma.sql`AND POSITION(LOWER(${search}) IN LOWER(COALESCE(r.recipe_name, ''))) > 0`
      : Prisma.empty;
    const where = Prisma.sql`w.user_id = ${userId} ${searchWhere}`;
    const totals = await this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM wishlist w
      JOIN recipes r ON r.recipe_id = w.recipe_id
      WHERE ${where}
    `);
    const total = Number(totals[0]?.total ?? 0);
    const limit = Math.min(Math.max(query.limit ?? DEFAULT_WISHLIST_LIMIT, 1), MAX_WISHLIST_LIMIT);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(
      Math.min(Math.max(query.page ?? DEFAULT_WISHLIST_PAGE, 1), MAX_WISHLIST_PAGE),
      totalPages,
    );
    const offset = (page - 1) * limit;
    const wishlist = await this.findItems(where, { limit, offset, sort: query.sort ?? 'recent' });

    return {
      wishlist,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages },
    };
  }

  async add(userId: number, recipeId: number): Promise<WishlistItem | null> {
    await this.prisma.$queryRaw<{ wishlist_id: number }[]>(Prisma.sql`
      INSERT INTO wishlist (user_id, recipe_id)
      SELECT ${userId}, r.recipe_id
      FROM recipes r
      WHERE r.recipe_id = ${recipeId}
      ON CONFLICT (user_id, recipe_id) DO NOTHING
      RETURNING wishlist_id
    `);

    const items = await this.findItems(
      Prisma.sql`w.user_id = ${userId} AND w.recipe_id = ${recipeId}`,
    );
    return items[0] ?? null;
  }

  async remove(userId: number, recipeId: number): Promise<boolean> {
    const deleted = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM wishlist
      WHERE user_id = ${userId} AND recipe_id = ${recipeId}
    `);
    return deleted > 0;
  }

  private async findItems(
    where: Prisma.Sql,
    pagination?: { limit: number; offset: number; sort: WishlistSort },
  ): Promise<WishlistItem[]> {
    const orderBy = pagination ? this.orderBy(pagination.sort) : Prisma.sql`w.date_added DESC, w.wishlist_id DESC`;
    const pageSql = pagination
      ? Prisma.sql`LIMIT ${pagination.limit} OFFSET ${pagination.offset}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<WishlistRow[]>(Prisma.sql`
      SELECT
        w.date_added AS saved_at,
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
        COUNT(rt.rating_id)::int AS num_ratings
      FROM wishlist w
      JOIN recipes r ON r.recipe_id = w.recipe_id
      JOIN meals m ON m.meal_id = r.meal_id
      JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN rating rt ON rt.recipe_id = r.recipe_id
      WHERE ${where}
      GROUP BY w.wishlist_id, w.date_added, r.recipe_id, m.meal_id, c.category_id
      ORDER BY ${orderBy}
      ${pageSql}
    `);

    return rows.map((row) => this.toItem(row));
  }

  private orderBy(sort: WishlistSort): Prisma.Sql {
    switch (sort) {
      case 'name':
        return Prisma.sql`LOWER(COALESCE(r.recipe_name, '')) ASC, r.recipe_id ASC, w.wishlist_id ASC`;
      case 'rating':
        return Prisma.sql`overall_score DESC, num_ratings DESC, w.wishlist_id DESC`;
      case 'recent':
      default:
        return Prisma.sql`w.date_added DESC NULLS LAST, w.wishlist_id DESC`;
    }
  }

  private toItem(row: WishlistRow): WishlistItem {
    return {
      recipe: {
        recipe_id: row.recipe_id,
        recipe_name: row.recipe_name,
        recipe_description: row.recipe_description,
        prep_time_minutes: row.prep_time_minutes,
        cook_time_minutes: row.cook_time_minutes,
        total_time_minutes: row.total_time_minutes,
        date_added: row.date_added,
        image_url: row.image_url,
        user_id: row.user_id,
        meal_id: row.meal_id,
        meal_name: row.meal_name,
        meal_description: row.meal_description,
        category_id: row.category_id,
        category_name: row.category_name,
        overall_score: row.overall_score,
        num_ratings: row.num_ratings,
      },
      savedAt: new Date(row.saved_at).toISOString(),
    };
  }
}
