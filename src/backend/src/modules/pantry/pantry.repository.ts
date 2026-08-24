import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type PantryItemRecord = { pantry_id: number; user_id: number; name: string; have: boolean; updated_at: Date };

export interface PantryRepositoryPort {
  list(userId: number): Promise<PantryItemRecord[]>;
  create(userId: number, name: string, have: boolean): Promise<PantryItemRecord>;
  update(userId: number, pantryId: number, name?: string, have?: boolean): Promise<PantryItemRecord | null>;
  remove(userId: number, pantryId: number): Promise<boolean>;
}

export const PANTRY_REPOSITORY = Symbol('PANTRY_REPOSITORY');

@Injectable()
export class PantryRepository implements PantryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: number): Promise<PantryItemRecord[]> {
    return this.prisma.$queryRaw<PantryItemRecord[]>(Prisma.sql`
      SELECT pantry_id, user_id, name, have, updated_at
      FROM pantry_items
      WHERE user_id = ${userId}
      ORDER BY have DESC, LOWER(name) ASC, pantry_id ASC
    `);
  }

  async create(userId: number, name: string, have: boolean): Promise<PantryItemRecord> {
    const rows = await this.prisma.$queryRaw<{ pantry_id: number }[]>(Prisma.sql`
      INSERT INTO pantry_items (user_id, name, have)
      VALUES (${userId}, ${name}, ${have})
      RETURNING pantry_id
    `);
    return (await this.find(userId, rows[0].pantry_id))!;
  }

  async update(userId: number, pantryId: number, name?: string, have?: boolean): Promise<PantryItemRecord | null> {
    const current = await this.find(userId, pantryId);
    if (!current) return null;
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE pantry_items
      SET name = ${name ?? current.name}, have = ${have ?? current.have}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND pantry_id = ${pantryId}
    `);
    return this.find(userId, pantryId);
  }

  async remove(userId: number, pantryId: number): Promise<boolean> {
    return (await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM pantry_items WHERE user_id = ${userId} AND pantry_id = ${pantryId}
    `)) > 0;
  }

  private async find(userId: number, pantryId: number): Promise<PantryItemRecord | null> {
    const rows = await this.prisma.$queryRaw<PantryItemRecord[]>(Prisma.sql`
      SELECT pantry_id, user_id, name, have, updated_at
      FROM pantry_items WHERE user_id = ${userId} AND pantry_id = ${pantryId}
    `);
    return rows[0] ?? null;
  }
}
