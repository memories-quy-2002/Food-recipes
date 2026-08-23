import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CollectionRecord = {
  collection_id: number;
  name: string;
  recipe_count: number;
  created_at: Date;
  updated_at: Date;
};

export interface CollectionsRepositoryPort {
  listByUserId(userId: number): Promise<CollectionRecord[]>;
  findOwned(userId: number, collectionId: number): Promise<CollectionRecord | null>;
  create(userId: number, name: string): Promise<CollectionRecord>;
  update(userId: number, collectionId: number, name: string): Promise<CollectionRecord | null>;
  remove(userId: number, collectionId: number): Promise<boolean>;
  recipeExists(recipeId: number): Promise<boolean>;
  recipeInCollection(collectionId: number, recipeId: number): Promise<boolean>;
  addRecipe(collectionId: number, recipeId: number): Promise<boolean>;
  removeRecipe(userId: number, collectionId: number, recipeId: number): Promise<boolean>;
}

export const COLLECTIONS_REPOSITORY = Symbol('COLLECTIONS_REPOSITORY');

@Injectable()
export class CollectionsRepository implements CollectionsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: number): Promise<CollectionRecord[]> {
    const rows = await this.prisma.$queryRaw<CollectionRecord[]>(Prisma.sql`
      SELECT c.collection_id, c.name, c.created_at, c.updated_at,
             COUNT(i.collection_item_id)::int AS recipe_count
      FROM saved_collections c
      LEFT JOIN saved_collection_items i ON i.collection_id = c.collection_id
      WHERE c.user_id = ${userId}
      GROUP BY c.collection_id
      ORDER BY c.updated_at DESC, c.collection_id DESC
    `);
    return rows.map((row) => this.normalize(row));
  }

  async findOwned(userId: number, collectionId: number): Promise<CollectionRecord | null> {
    const rows = await this.prisma.$queryRaw<CollectionRecord[]>(Prisma.sql`
      SELECT c.collection_id, c.name, c.created_at, c.updated_at,
             COUNT(i.collection_item_id)::int AS recipe_count
      FROM saved_collections c
      LEFT JOIN saved_collection_items i ON i.collection_id = c.collection_id
      WHERE c.user_id = ${userId} AND c.collection_id = ${collectionId}
      GROUP BY c.collection_id
    `);
    return rows[0] ? this.normalize(rows[0]) : null;
  }

  async create(userId: number, name: string): Promise<CollectionRecord> {
    const rows = await this.prisma.$queryRaw<{ collection_id: number }[]>(Prisma.sql`
      INSERT INTO saved_collections (user_id, name)
      VALUES (${userId}, ${name})
      RETURNING collection_id
    `);
    return (await this.findOwned(userId, rows[0].collection_id))!;
  }

  async update(userId: number, collectionId: number, name: string): Promise<CollectionRecord | null> {
    const rows = await this.prisma.$queryRaw<{ collection_id: number }[]>(Prisma.sql`
      UPDATE saved_collections
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND collection_id = ${collectionId}
      RETURNING collection_id
    `);
    return rows[0] ? this.findOwned(userId, collectionId) : null;
  }

  async remove(userId: number, collectionId: number): Promise<boolean> {
    const result = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM saved_collections
      WHERE user_id = ${userId} AND collection_id = ${collectionId}
    `);
    return result > 0;
  }

  async recipeExists(recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ recipe_id: number }[]>(Prisma.sql`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async recipeInCollection(collectionId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ collection_item_id: number }[]>(Prisma.sql`
      SELECT collection_item_id
      FROM saved_collection_items
      WHERE collection_id = ${collectionId} AND recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async addRecipe(collectionId: number, recipeId: number): Promise<boolean> {
    const inserted = await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO saved_collection_items (collection_id, recipe_id)
      VALUES (${collectionId}, ${recipeId})
      ON CONFLICT ON CONSTRAINT saved_collection_recipe_key DO NOTHING
    `);
    if (inserted === 0) return false;
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE saved_collections SET updated_at = CURRENT_TIMESTAMP
      WHERE collection_id = ${collectionId}
    `);
    return true;
  }

  async removeRecipe(userId: number, collectionId: number, recipeId: number): Promise<boolean> {
    const result = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM saved_collection_items i
      USING saved_collections c
      WHERE i.collection_id = c.collection_id
        AND c.user_id = ${userId}
        AND i.collection_id = ${collectionId}
        AND i.recipe_id = ${recipeId}
    `);
    if (result > 0) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE saved_collections SET updated_at = CURRENT_TIMESTAMP
        WHERE collection_id = ${collectionId}
      `);
    }
    return result > 0;
  }

  private normalize(row: CollectionRecord): CollectionRecord {
    return { ...row, recipe_count: Number(row.recipe_count) };
  }
}
