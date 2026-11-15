import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { WeeklyShoppingLine } from './weekly-shopping.calculator';

@Injectable()
export class WeeklyShoppingWriter {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Preserve manually entered and checked lines. Lock individual ingredient
   * keys in a deterministic order, and make repeated confirmation idempotent.
   */
  async addItems(userId: number, householdId: number | undefined, items: readonly WeeklyShoppingLine[]): Promise<number> {
    const scope = householdId === undefined ? 'personal:' + userId : 'household:' + householdId;
    const sorted = [...items].sort((a, b) =>
      (a.name.trim().toLowerCase() + ':' + a.quantity).localeCompare(b.name.trim().toLowerCase() + ':' + b.quantity));
    return this.prisma.$transaction(async (tx) => {
      let added = 0;
      for (const item of sorted) {
        const label = item.name.trim();
        const quantity = item.quantity;
        const lockKey = scope + ':' + label.toLowerCase() + ':' + quantity;
        await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
        const result = await tx.$queryRaw<Array<{ item_id: number }>>(Prisma.sql`
          INSERT INTO shopping_list_items (${householdId === undefined ? Prisma.sql`user_id` : Prisma.sql`household_id`}, label, quantity, source_recipe_id)
          SELECT ${householdId === undefined ? userId : householdId}, ${label}, ${quantity}, ${item.sourceRecipeId}
          WHERE NOT EXISTS (
            SELECT 1 FROM shopping_list_items
            WHERE ${householdId === undefined ? Prisma.sql`user_id = ${userId}` : Prisma.sql`household_id = ${householdId}`}
              AND checked = FALSE
              AND LOWER(TRIM(label)) = LOWER(TRIM(${label}))
              AND COALESCE(quantity, '') = ${quantity}
          )
          ON CONFLICT DO NOTHING
          RETURNING item_id
        `);
        added += result.length;
      }
      return added;
    });
  }
}
