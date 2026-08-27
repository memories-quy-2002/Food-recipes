import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CookingSessionService } from './cooking-session.service';
import type {
  CompletedCookingSessionResult,
  CookingSessionRecord,
  CookingSessionRepositoryPort,
} from './cooking-session.repository';

describe('CookingSessionService', () => {
  const session: CookingSessionRecord = {
    session_id: 31,
    user_id: 7,
    recipe_id: 15,
    recipe_name: 'Pasta Carbonara',
    meal_plan_item_id: 42,
    planned_date: '2026-08-25',
    slot: 'dinner',
    servings: 4,
    current_step: 1,
    status: 'active',
    started_at: new Date('2026-08-25T17:00:00.000Z'),
    last_active_at: new Date('2026-08-25T17:10:00.000Z'),
    paused_at: null,
    completed_at: null,
    created_at: new Date('2026-08-25T17:00:00.000Z'),
    updated_at: new Date('2026-08-25T17:10:00.000Z'),
  };
  const completion: CompletedCookingSessionResult = {
    session: { ...session, status: 'completed', completed_at: new Date('2026-08-25T17:35:00.000Z') },
    history: {
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
    },
  };
  const repository: jest.Mocked<CookingSessionRepositoryPort> = {
    findActive: jest.fn(),
    start: jest.fn(),
    update: jest.fn(),
    complete: jest.fn(),
    abandon: jest.fn(),
    recipeExists: jest.fn(),
    mealPlanItemBelongsToUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.recipeExists.mockResolvedValue(true);
    repository.mealPlanItemBelongsToUser.mockResolvedValue(true);
  });

  it('returns the latest active or paused session for the user', async () => {
    repository.findActive.mockResolvedValue(session);
    const service = new CookingSessionService(repository);

    await expect(service.getActive(7, {})).resolves.toEqual({ session });
    expect(repository.findActive).toHaveBeenCalledWith(7, undefined);
  });

  it('starts or resumes a session after validating the recipe and plan item', async () => {
    repository.start.mockResolvedValue(session);
    const service = new CookingSessionService(repository);

    await expect(service.start(7, { recipeId: 15, mealPlanItemId: 42, servings: 4 })).resolves.toEqual({ session });
    expect(repository.mealPlanItemBelongsToUser).toHaveBeenCalledWith(7, 42, 15);
    expect(repository.start).toHaveBeenCalledWith(7, 15, 42, 4);
  });

  it('rejects an unknown recipe before creating a session', async () => {
    repository.recipeExists.mockResolvedValue(false);
    const service = new CookingSessionService(repository);

    await expect(service.start(7, { recipeId: 999 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.start).not.toHaveBeenCalled();
  });

  it('rejects an unowned plan item before creating a session', async () => {
    repository.mealPlanItemBelongsToUser.mockResolvedValue(false);
    const service = new CookingSessionService(repository);

    await expect(service.start(7, { recipeId: 15, mealPlanItemId: 999 })).rejects.toMatchObject({
      response: { code: 'COOKING_SESSION_PLAN_ITEM_NOT_FOUND' },
    });
    expect(repository.start).not.toHaveBeenCalled();
  });

  it('saves progress and rejects empty updates', async () => {
    repository.update.mockResolvedValue(session);
    const service = new CookingSessionService(repository);

    await expect(service.update(7, 31, { currentStep: 2, status: 'paused' })).resolves.toEqual({ session });
    expect(repository.update).toHaveBeenCalledWith(7, 31, 2, 'paused');
    await expect(service.update(7, 31, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('completes a session through the repository transaction', async () => {
    repository.complete.mockResolvedValue(completion);
    const service = new CookingSessionService(repository);

    await expect(service.complete(7, 31)).resolves.toEqual(completion);
    expect(repository.complete).toHaveBeenCalledWith(7, 31, undefined);
  });

  it('rejects completion, updates, and abandonment of missing sessions', async () => {
    repository.complete.mockResolvedValue(null);
    repository.update.mockResolvedValue(null);
    repository.abandon.mockResolvedValue(false);
    const service = new CookingSessionService(repository);

    await expect(service.complete(7, 31)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(7, 31, { currentStep: 1 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.abandon(7, 31)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a shortage conflict before changing a session', async () => {
    repository.complete.mockResolvedValue({
      status: 'needs_confirmation',
      shortages: [{
        position: 1,
        ingredient_name: 'rice',
        required_quantity: 500,
        required_unit: 'GRAM',
        available_quantity: 300,
        missing_quantity: 200,
        pantry_id: 8,
      }],
    });
    const service = new CookingSessionService(repository);

    await expect(service.complete(7, 31)).rejects.toMatchObject({
      response: { code: 'COOKING_PANTRY_SHORTAGE', shortages: [{ missing_quantity: 200 }] },
    });
    expect(repository.complete).toHaveBeenCalledWith(7, 31, undefined);
  });

  it('passes the shopping decision through without completing the session', async () => {
    const handoff = { status: 'shopping_list_updated' as const, session, shortages: [], added_shopping_items: 1 };
    repository.complete.mockResolvedValue(handoff);
    const service = new CookingSessionService(repository);

    await expect(service.complete(7, 31, { action: 'shopping' })).resolves.toEqual(handoff);
    expect(repository.complete).toHaveBeenCalledWith(7, 31, 'shopping');
  });
});
