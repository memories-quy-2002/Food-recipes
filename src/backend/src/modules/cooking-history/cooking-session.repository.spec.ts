import { CookingSessionRepository } from './cooking-session.repository';

describe('CookingSessionRepository concurrency', () => {
  it('reuses a planned session only when the requested meal-plan item matches exactly', async () => {
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ session_id: 101 }])
        .mockResolvedValueOnce([{ session_id: 101, meal_plan_item_id: 42 }]),
      $executeRaw: jest.fn(),
    };
    const repository = new CookingSessionRepository(prisma as never);

    await repository.start(7, 15, 42, 2);

    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/meal_plan_item_id\s*=\s*/i);
    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).not.toMatch(/WHERE user_id = .*AND recipe_id = .*AND status/i);
  });

  it('reuses only the unplanned session for a start without a meal-plan item', async () => {
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ session_id: 101 }])
        .mockResolvedValueOnce([{ session_id: 101, meal_plan_item_id: null }]),
      $executeRaw: jest.fn(),
    };
    const repository = new CookingSessionRepository(prisma as never);

    await repository.start(7, 15, null, 2);

    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/meal_plan_item_id\s+IS\s+NULL/i);
  });

  it('maps an active plan-item unique race to a controlled conflict', async () => {
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce({ code: '23505' }),
    };
    const repository = new CookingSessionRepository(prisma as never);

    await expect(repository.start(7, 15, 42, 2, 'leftover', 8, 22)).rejects.toMatchObject({
      response: { code: 'COOKING_SESSION_ALREADY_ACTIVE' },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(prisma.$queryRaw.mock.calls[1][0].strings.join(' ')).toMatch(/INSERT INTO cooking_sessions/);
  });

  it('writes leftover provenance when completing a leftover-backed session', async () => {
    const startedAt = new Date('2026-08-30T10:00:00Z');
    const completedAt = new Date('2026-08-30T10:30:00Z');
    const session = {
      session_id: 31, user_id: 7, recipe_id: 15, recipe_name: 'Soup', meal_plan_item_id: 42,
      source_type: 'leftover', leftover_batch_id: 8, household_id: null, planned_date: '2026-08-30', slot: 'dinner',
      servings: 2, current_step: 1, status: 'active', started_at: startedAt, last_active_at: startedAt,
      paused_at: null, completed_at: null, created_at: startedAt, updated_at: startedAt,
    };
    const tx = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([session])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ servings: 1 }])
        .mockResolvedValueOnce([{ ...session, status: 'completed', completed_at: completedAt }])
        .mockResolvedValueOnce([{ history_id: 44, user_id: 7, recipe_id: 15, meal_plan_item_id: 42, source_type: 'leftover', leftover_batch_id: 8, servings: 2, started_at: startedAt, completed_at: completedAt, created_at: completedAt }]),
      $executeRaw: jest.fn(),
    };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
    const repository = new CookingSessionRepository(prisma as never);

    await expect(repository.complete(7, 31, 'complete')).resolves.toMatchObject({
      history: { source_type: 'leftover', leftover_batch_id: 8 },
    });
    expect(tx.$queryRaw.mock.calls[4][0].strings.join(' ')).toMatch(/source_type.*leftover_batch_id/i);
  });
});
