import { CookingHistoryRepository } from './cooking-history.repository';

describe('CookingHistoryRepository source provenance', () => {
  it('accepts a manual history plan item only when its source is recipe', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ item_id: 42 }]) };
    const repository = new CookingHistoryRepository(prisma as never);

    await expect(repository.mealPlanItemBelongsToUser(7, 42, 15)).resolves.toBe(true);
    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/source_type\s*=\s*'recipe'/i);
  });

  it('writes manual history with recipe provenance and no leftover batch', async () => {
    const item = {
      history_id: 12, user_id: 7, recipe_id: 15, recipe_name: 'Soup', meal_plan_item_id: null,
      source_type: 'recipe' as const, leftover_batch_id: null, planned_date: null, slot: null, servings: 1,
      started_at: new Date('2026-08-30T10:00:00Z'), completed_at: new Date('2026-08-30T10:30:00Z'),
      created_at: new Date('2026-08-30T10:30:00Z'),
    };
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ history_id: 12 }])
        .mockResolvedValueOnce([item]),
    };
    const repository = new CookingHistoryRepository(prisma as never);

    await expect(repository.create(7, 15, null, 1, item.started_at, item.completed_at)).resolves.toEqual(item);
    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/source_type.*leftover_batch_id/i);
  });
});
