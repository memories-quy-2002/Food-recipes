import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CookingHistoryService } from './cooking-history.service';
import type { CookingHistoryRepositoryPort } from './cooking-history.repository';

describe('CookingHistoryService', () => {
  const item = {
    history_id: 12,
    user_id: 7,
    recipe_id: 15,
    recipe_name: 'Pasta Carbonara',
    meal_plan_item_id: 42,
    planned_date: '2026-08-25',
    slot: 'dinner',
    servings: 4,
    started_at: new Date('2026-08-25T17:00:00.000Z'),
    completed_at: new Date('2026-08-25T17:35:00.000Z'),
    created_at: new Date('2026-08-25T17:35:00.000Z'),
  };
  const repository: jest.Mocked<CookingHistoryRepositoryPort> = {
    list: jest.fn(),
    recipeExists: jest.fn(),
    mealPlanItemBelongsToUser: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.recipeExists.mockResolvedValue(true);
    repository.mealPlanItemBelongsToUser.mockResolvedValue(true);
  });

  it('lists only through the user-scoped repository contract', async () => {
    repository.list.mockResolvedValue([item]);
    const service = new CookingHistoryService(repository);

    await expect(service.list(7)).resolves.toEqual({ items: [item] });
    expect(repository.list).toHaveBeenCalledWith(7, 100);
  });

  it('records a completed session with safe defaults', async () => {
    repository.create.mockResolvedValue(item);
    const service = new CookingHistoryService(repository);

    await expect(service.create(7, { recipeId: 15, mealPlanItemId: 42, servings: 4 })).resolves.toEqual({ item });
    expect(repository.create).toHaveBeenCalledWith(7, 15, 42, 4, expect.any(Date), expect.any(Date));
  });

  it('rejects an unknown recipe before inserting history', async () => {
    repository.recipeExists.mockResolvedValue(false);
    const service = new CookingHistoryService(repository);

    await expect(service.create(7, { recipeId: 999 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a meal-plan item that is not owned or does not match the recipe', async () => {
    repository.mealPlanItemBelongsToUser.mockResolvedValue(false);
    const service = new CookingHistoryService(repository);

    await expect(service.create(7, { recipeId: 15, mealPlanItemId: 999 })).rejects.toMatchObject({ response: { code: 'COOKING_HISTORY_PLAN_ITEM_NOT_FOUND' } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects completion timestamps before the start timestamp', async () => {
    const service = new CookingHistoryService(repository);

    await expect(service.create(7, {
      recipeId: 15,
      startedAt: '2026-08-25T18:00:00.000Z',
      completedAt: '2026-08-25T17:00:00.000Z',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
