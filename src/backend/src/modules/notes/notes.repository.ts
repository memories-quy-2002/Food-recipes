import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type RecipeNoteRecord = {
  user_id: number;
  recipe_id: number;
  note: string;
  updated_at: Date;
};

export interface NotesRepositoryPort {
  recipeExists(recipeId: number): Promise<boolean>;
  findByUserAndRecipe(userId: number, recipeId: number): Promise<RecipeNoteRecord | null>;
  upsert(userId: number, recipeId: number, note: string): Promise<RecipeNoteRecord>;
  remove(userId: number, recipeId: number): Promise<boolean>;
}

export const NOTES_REPOSITORY = Symbol('NOTES_REPOSITORY');

@Injectable()
export class NotesRepository implements NotesRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async recipeExists(recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async findByUserAndRecipe(userId: number, recipeId: number): Promise<RecipeNoteRecord | null> {
    const rows = await this.prisma.$queryRaw<RecipeNoteRecord[]>(Prisma.sql`
      SELECT user_id, recipe_id, note, updated_at
      FROM recipe_notes
      WHERE user_id = ${userId} AND recipe_id = ${recipeId}
    `);
    return rows[0] ?? null;
  }

  async upsert(userId: number, recipeId: number, note: string): Promise<RecipeNoteRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO recipe_notes (user_id, recipe_id, note)
      VALUES (${userId}, ${recipeId}, ${note})
      ON CONFLICT (user_id, recipe_id)
      DO UPDATE SET note = EXCLUDED.note, updated_at = CURRENT_TIMESTAMP
    `);
    return (await this.findByUserAndRecipe(userId, recipeId))!;
  }

  async remove(userId: number, recipeId: number): Promise<boolean> {
    const result = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM recipe_notes WHERE user_id = ${userId} AND recipe_id = ${recipeId}
    `);
    return result > 0;
  }
}
