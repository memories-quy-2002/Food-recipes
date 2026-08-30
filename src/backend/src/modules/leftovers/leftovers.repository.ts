import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CompletedHistoryForLeftover = { history_id: number; user_id: number; recipe_id: number; recipe_name: string; servings: number; completed_at: Date; recipe_status: string; recipe_user_id: number; source_type?: 'recipe'; leftover_batch_id?: null };
export type LeftoverRecord = { leftover_id: number; user_id: number | null; household_id: number | null; recipe_id: number; recipe_name: string; history_id: number; cooked_servings: number; remaining_servings: number; prepared_at: Date; expires_at: Date };
export interface LeftoversRepositoryPort {
  findCompletedHistory(userId: number, historyId: number): Promise<CompletedHistoryForLeftover | null>;
  findByHistory(historyId: number, userId: number, householdId: number | null): Promise<LeftoverRecord | null>;
  create(userId: number, householdId: number | null, historyId: number, recipeId: number, cookedServings: number, remainingServings: number, expiresAt: Date): Promise<LeftoverRecord | null>;
  listAvailable(userId: number, householdId: number | null): Promise<LeftoverRecord[]>;
}
export const LEFTOVERS_REPOSITORY = Symbol('LEFTOVERS_REPOSITORY');

@Injectable()
export class LeftoversRepository implements LeftoversRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findCompletedHistory(userId: number, historyId: number) {
    const rows = await this.prisma.$queryRaw<CompletedHistoryForLeftover[]>(Prisma.sql`SELECT h.history_id, h.user_id, h.recipe_id, r.recipe_name, h.servings, h.completed_at, h.source_type, h.leftover_batch_id, r.status AS recipe_status, r.user_id AS recipe_user_id FROM cooking_history h JOIN recipes r ON r.recipe_id = h.recipe_id WHERE h.history_id = ${historyId} AND h.source_type = 'recipe' AND h.leftover_batch_id IS NULL`);
    return rows[0] ?? null;
  }
  async findByHistory(historyId: number, userId: number, householdId: number | null) {
    const owner = householdId === null
      ? Prisma.sql`b.user_id = ${userId} AND b.household_id IS NULL`
      : Prisma.sql`b.household_id = ${householdId}`;
    const rows = await this.prisma.$queryRaw<LeftoverRecord[]>(Prisma.sql`SELECT b.leftover_id, b.user_id, b.household_id, b.recipe_id, r.recipe_name, b.history_id, b.cooked_servings, b.remaining_servings, b.prepared_at, b.expires_at FROM leftover_batches b JOIN recipes r ON r.recipe_id = b.recipe_id WHERE b.history_id = ${historyId} AND ${owner} LIMIT 1`);
    return rows[0] ?? null;
  }
  async create(userId: number, householdId: number | null, historyId: number, recipeId: number, cookedServings: number, remainingServings: number, expiresAt: Date) {
    await this.prisma.$executeRaw(Prisma.sql`INSERT INTO leftover_batches (user_id, household_id, history_id, recipe_id, cooked_servings, remaining_servings, prepared_at, expires_at) VALUES (${householdId === null ? userId : null}, ${householdId}, ${historyId}, ${recipeId}, ${cookedServings}, ${remainingServings}, (SELECT completed_at FROM cooking_history WHERE history_id = ${historyId}), ${expiresAt}) ON CONFLICT (history_id) DO NOTHING`);
    return this.findByHistory(historyId, userId, householdId);
  }
  async listAvailable(userId: number, householdId: number | null) {
    return this.prisma.$queryRaw<LeftoverRecord[]>(Prisma.sql`SELECT b.leftover_id, b.user_id, b.household_id, b.recipe_id, r.recipe_name, b.history_id, b.cooked_servings, b.remaining_servings, b.prepared_at, b.expires_at FROM leftover_batches b JOIN recipes r ON r.recipe_id = b.recipe_id WHERE ${householdId === null ? Prisma.sql`b.user_id = ${userId} AND b.household_id IS NULL` : Prisma.sql`b.household_id = ${householdId}`} AND b.remaining_servings > 0 AND b.expires_at > CURRENT_TIMESTAMP ORDER BY b.expires_at ASC, b.leftover_id ASC`);
  }
}
