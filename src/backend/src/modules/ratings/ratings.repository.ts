import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type RatingAggregate = {
  overall_score: number;
  num_ratings: number;
};

export type RatingRecord = {
  rating_id: number;
  recipe_id: number;
  recipe_name: string;
  image_url: string | null;
  score: number;
  review: string | null;
  date_added: Date | null;
};

export type ReviewRecord = {
  rating_id: number;
  score: number;
  review: string | null;
  date_added: Date | null;
  full_name: string;
};

export type RatingMutationResult = {
  aggregate: RatingAggregate;
};

export type ReviewsResult = {
  reviews: ReviewRecord[];
  aggregate: RatingAggregate;
};

export interface RatingsRepositoryPort {
  findRecipeAuthorId(recipeId: number): Promise<number | null>;
  upsert(
    userId: number,
    recipeId: number,
    score: number,
    review: string | null,
  ): Promise<RatingMutationResult | null>;
  remove(userId: number, recipeId: number): Promise<RatingMutationResult | null>;
  listByUserId(userId: number): Promise<RatingRecord[]>;
  listByRecipeId(recipeId: number): Promise<ReviewsResult>;
}

export const RATINGS_REPOSITORY = Symbol('RATINGS_REPOSITORY');

@Injectable()
export class RatingsRepository implements RatingsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findRecipeAuthorId(recipeId: number): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
      SELECT user_id
      FROM recipes
      WHERE recipe_id = ${recipeId}
    `);
    return rows[0]?.user_id ?? null;
  }

  async upsert(
    userId: number,
    recipeId: number,
    score: number,
    review: string | null,
  ): Promise<RatingMutationResult | null> {
    const rows = await this.prisma.$queryRaw<RatingAggregate[]>(Prisma.sql`
      WITH upserted AS (
        INSERT INTO rating (user_id, recipe_id, score, review)
        SELECT ${userId}, r.recipe_id, ${score}, ${review}
        FROM recipes r
        WHERE r.recipe_id = ${recipeId}
        ON CONFLICT (user_id, recipe_id)
        DO UPDATE SET
          score = EXCLUDED.score,
          review = EXCLUDED.review,
          date_added = CURRENT_TIMESTAMP
        RETURNING recipe_id, user_id, score
      )
      SELECT
        COALESCE(ROUND(AVG(source.score), 1), 0)::float8 AS overall_score,
        COUNT(*)::int AS num_ratings
      FROM (
        SELECT rt.score
        FROM rating rt
        WHERE rt.recipe_id = ${recipeId}
          AND NOT EXISTS (
            SELECT 1
            FROM upserted u
            WHERE u.recipe_id = rt.recipe_id
              AND u.user_id = rt.user_id
          )
        UNION ALL
        SELECT u.score
        FROM upserted u
      ) AS source
    `);

    return rows[0] ? { aggregate: this.toAggregate(rows[0]) } : null;
  }

  async remove(userId: number, recipeId: number): Promise<RatingMutationResult | null> {
    const rows = await this.prisma.$queryRaw<RatingAggregate[]>(Prisma.sql`
      WITH deleted AS (
        DELETE FROM rating
        WHERE user_id = ${userId} AND recipe_id = ${recipeId}
        RETURNING recipe_id
      )
      SELECT
        COALESCE(ROUND(AVG(rt.score), 1), 0)::float8 AS overall_score,
        COUNT(rt.rating_id)::int AS num_ratings
      FROM deleted d
      LEFT JOIN rating rt ON rt.recipe_id = d.recipe_id
      GROUP BY d.recipe_id
    `);

    return rows[0] ? { aggregate: this.toAggregate(rows[0]) } : null;
  }

  async listByUserId(userId: number): Promise<RatingRecord[]> {
    const rows = await this.prisma.$queryRaw<RatingRecord[]>(Prisma.sql`
      SELECT
        rt.rating_id,
        rt.recipe_id,
        r.recipe_name,
        r.image_url,
        rt.score::float8 AS score,
        rt.review,
        rt.date_added
      FROM rating rt
      JOIN recipes r ON r.recipe_id = rt.recipe_id
      WHERE rt.user_id = ${userId}
      ORDER BY rt.date_added DESC NULLS LAST, rt.rating_id DESC
    `);
    return rows;
  }

  async listByRecipeId(recipeId: number): Promise<ReviewsResult> {
    const reviews = await this.prisma.$queryRaw<ReviewRecord[]>(Prisma.sql`
      SELECT
        rt.rating_id,
        rt.score::float8 AS score,
        rt.review,
        rt.date_added,
        a.full_name
      FROM rating rt
      JOIN accounts a ON a.user_id = rt.user_id
      WHERE rt.recipe_id = ${recipeId}
      ORDER BY rt.date_added DESC NULLS LAST, rt.rating_id DESC
    `);
    const aggregateRows = await this.prisma.$queryRaw<RatingAggregate[]>(Prisma.sql`
      SELECT
        COALESCE(ROUND(AVG(score), 1), 0)::float8 AS overall_score,
        COUNT(rating_id)::int AS num_ratings
      FROM rating
      WHERE recipe_id = ${recipeId}
    `);

    return {
      reviews,
      aggregate: this.toAggregate(aggregateRows[0]),
    };
  }

  private toAggregate(row?: RatingAggregate): RatingAggregate {
    return {
      overall_score: Number(row?.overall_score ?? 0),
      num_ratings: Number(row?.num_ratings ?? 0),
    };
  }
}
