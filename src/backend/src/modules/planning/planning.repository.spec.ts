import { PlanningRepository } from './planning.repository';

describe('PlanningRepository recommendation removal writes', () => {
  it('reads a newly reserved personal leftover through the transaction client', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValueOnce([{ plan_id: 4 }]).mockResolvedValueOnce([{ item_id: 19 }]).mockResolvedValueOnce([{ item_id: 19, plan_id: 4, recipe_id: 15, recipe_name: 'Soup', source_type: 'leftover', leftover_batch_id: 8, planned_date: '2026-08-31', slot: 'dinner', servings: 2, cooking_status: 'planned', created_at: new Date() }]), $executeRaw: jest.fn() };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)), $queryRaw: jest.fn() };
    const repository = new PlanningRepository(prisma as never);
    await expect(repository.addLeftoverPlanItem(7, 4, { leftoverBatchId: 8, date: '2026-08-31', slot: 'dinner', servings: 2 })).resolves.toEqual(expect.objectContaining({ item_id: 19 }));
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(tx.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/FROM meal_plans.*FOR UPDATE/is);
  });

  it('restores every uncompleted leftover reservation before deleting a personal plan', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValueOnce([{ plan_id: 4 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ item_id: 19, source_type: 'leftover', leftover_batch_id: 8, servings: 2 }]), $executeRaw: jest.fn().mockResolvedValue(1) };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
    const repository = new PlanningRepository(prisma as never);
    await expect(repository.deletePlan(7, 4)).resolves.toBe(true);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/FROM meal_plans.*FOR UPDATE/is);
  });

  it('checks completion before deleting an item so a nulled FK cannot hide completed cooking', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ has_history: true }]).mockResolvedValueOnce([{ recipe_id: 15, source_type: 'leftover', leftover_batch_id: 8, servings: 2 }]), $executeRaw: jest.fn().mockResolvedValue(1) };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
    const repository = new PlanningRepository(prisma as never);
    await repository.deletePlanItemAndRecordRemoval(7, 4, 9);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('deletes an owned item and records its recipe in one transaction', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ recipe_id: 15, source_type: 'recipe', leftover_batch_id: null, servings: 1, has_history: false }]).mockResolvedValueOnce([{ recipe_id: 15 }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    };
    const repository = new PlanningRepository(prisma as never);

    await expect(repository.deletePlanItemAndRecordRemoval(7, 4, 9)).resolves.toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw.mock.calls[2][0].strings.join(' ')).toMatch(/DELETE/);
    expect(tx.$queryRaw.mock.calls[2][0].strings.join(' ')).toMatch(/RETURNING/);
    expect(tx.$executeRaw.mock.calls[0][0].strings.join(' ')).toMatch(/recommendation_meal_plan_removals/);
  });

  it('keeps household deletion scoped to the requested household', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn(),
    };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)) };
    const repository = new PlanningRepository(prisma as never);

    await expect(repository.deletePlanItemAndRecordRemovalForHousehold(7, 22, 4, 9)).resolves.toBe(false);
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.$queryRaw.mock.calls[1][0].strings.join(' ')).toMatch(/p.household_id/);
  });

  it('locks a personal plan before reserving a leftover', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([{ plan_id: 4 }]).mockResolvedValueOnce([{ item_id: 19 }]).mockResolvedValueOnce([{ item_id: 19, plan_id: 4, recipe_id: 15, recipe_name: 'Soup', source_type: 'leftover', leftover_batch_id: 8, planned_date: '2026-08-31', slot: 'dinner', servings: 2, cooking_status: 'planned', created_at: new Date() }]),
      $executeRaw: jest.fn(),
    };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)), $queryRaw: jest.fn() };
    const repository = new PlanningRepository(prisma as never);

    await repository.addLeftoverPlanItem(7, 4, { leftoverBatchId: 8, date: '2026-08-31', slot: 'dinner', servings: 2 });

    expect(tx.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/FROM meal_plans.*p\.user_id.*FOR UPDATE/is);
  });

  it('locks a household plan before reserving a leftover', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([{ plan_id: 4 }]).mockResolvedValueOnce([{ item_id: 19 }]).mockResolvedValueOnce([{ item_id: 19, plan_id: 4, recipe_id: 15, recipe_name: 'Soup', source_type: 'leftover', leftover_batch_id: 8, planned_date: '2026-08-31', slot: 'dinner', servings: 2, cooking_status: 'planned', created_at: new Date() }]),
      $executeRaw: jest.fn(),
    };
    const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)), $queryRaw: jest.fn() };
    const repository = new PlanningRepository(prisma as never);

    await repository.addLeftoverPlanItemForHousehold(22, 4, { leftoverBatchId: 8, date: '2026-08-31', slot: 'dinner', servings: 2 });

    expect(tx.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/FROM meal_plans.*p\.household_id.*FOR UPDATE/is);
  });
});
