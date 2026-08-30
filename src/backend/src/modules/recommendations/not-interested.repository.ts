import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface NotInterestedRepositoryPort {
  add(userId: number, recipeId: number): Promise<boolean>;
  remove(userId: number, recipeId: number): Promise<boolean>;
}

export const NOT_INTERESTED_REPOSITORY = Symbol('NOT_INTERESTED_REPOSITORY');

@Injectable()
export class NotInterestedRepository implements NotInterestedRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      INSERT INTO recommendation_not_interested (user_id, recipe_id)
      SELECT ${userId}, r.recipe_id
      FROM recipes r
      WHERE r.recipe_id = ${recipeId} AND r.status = 'published'
      ON CONFLICT (user_id, recipe_id) DO NOTHING
      RETURNING recipe_id
    `);
    if (rows.length) return true;

    const existing = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      SELECT n.recipe_id
      FROM recommendation_not_interested n
      JOIN recipes r ON r.recipe_id = n.recipe_id
      WHERE n.user_id = ${userId} AND n.recipe_id = ${recipeId}
        AND r.status = 'published'
    `);
    return existing.length > 0;
  }

  async remove(userId: number, recipeId: number): Promise<boolean> {
    return (await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM recommendation_not_interested
      WHERE user_id = ${userId} AND recipe_id = ${recipeId}
    `)) > 0;
  }
}
