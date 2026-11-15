import { WeeklyShoppingWriter } from './weekly-shopping.writer';
import type { WeeklyShoppingLine } from './weekly-shopping.calculator';

const line: WeeklyShoppingLine = {
  name: 'Rice', unit: 'GRAM', requiredQuantity: 600, availableQuantity: 100,
  missingQuantity: 500, quantity: '500 g', sourceRecipeId: 12, alreadyListed: false,
};

describe('WeeklyShoppingWriter', () => {
  it('writes inside one transaction with a scoped advisory lock and conflict guard', async () => {
    const tx = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }])
        .mockResolvedValueOnce([{ item_id: 1 }]),
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const writer = new WeeklyShoppingWriter(prisma as never);
    await expect(writer.addItems(7, undefined, [line])).resolves.toBe(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw.mock.calls[0][0].strings.join(' ')).toContain('pg_advisory_xact_lock');
    const sql = tx.$queryRaw.mock.calls[1][0].strings.join(' ');
    expect(sql).toContain('INSERT INTO shopping_list_items');
    expect(sql).toContain('ON CONFLICT DO NOTHING');
    expect(sql).toContain('checked = FALSE');
    expect(sql).toContain('user_id = ');
  });

  it('keeps the same insert idempotent after another request inserted the row', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };
    const writer = new WeeklyShoppingWriter({
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as never);
    await expect(writer.addItems(7, 4, [line])).resolves.toBe(0);
    expect(tx.$queryRaw.mock.calls[1][0].strings.join(' ')).toContain('household_id = ');
  });
});
