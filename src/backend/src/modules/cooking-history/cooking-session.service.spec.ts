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
    mealPlanItemBelongsToHousehold: jest.fn(),
    leftoverStartContext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.recipeExists.mockResolvedValue(true);
    repository.mealPlanItemBelongsToUser.mockResolvedValue(true);
    jest.mocked(repository.mealPlanItemBelongsToHousehold!).mockResolvedValue(true);
    repository.findActive.mockResolvedValue(null);
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

  it('uses household source-aware ownership for recipe plan items', async () => {
    repository.start.mockResolvedValue(session);
    const service = new CookingSessionService(repository);

    await expect(service.start(7, { recipeId: 15, mealPlanItemId: 42, householdId: 22 })).resolves.toEqual({ session });
    expect(repository.mealPlanItemBelongsToHousehold).toHaveBeenCalledWith(22, 42, 15);
    expect(repository.mealPlanItemBelongsToUser).not.toHaveBeenCalled();
  });

  it('starts a leftover source only when the owned batch is available', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.leftoverStartContext = jest.fn().mockResolvedValue({ mode: 'direct', available_servings: 3, leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, servings: 2 })).resolves.toEqual({ session });
    expect(repository.start).toHaveBeenCalledWith(7, 15, null, 2, 'leftover', 8);
  });

  it('rejects a direct leftover cook when requested servings exceed the available batch', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.leftoverStartContext = jest.fn().mockResolvedValue({ mode: 'direct', available_servings: 1, leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, servings: 2 })).rejects.toMatchObject({ response: { code: 'LEFTOVER_SERVINGS_UNAVAILABLE' } });
    expect(repository.start).not.toHaveBeenCalled();
  });

  it('requires a reserved leftover cook to use exactly the plan reservation', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.leftoverStartContext = jest.fn().mockResolvedValue({ mode: 'reserved', available_servings: 2, leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, mealPlanItemId: 42, servings: 1 })).rejects.toMatchObject({ response: { code: 'LEFTOVER_RESERVATION_MISMATCH' } });
  });

  it('rejects a recipe start when the active session is leftover-backed', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.findActive.mockResolvedValue({ ...session, source_type: 'leftover', leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15 })).rejects.toMatchObject({ response: { code: 'COOKING_SESSION_SOURCE_MISMATCH' } });
  });

  it('starts a fully reserved leftover plan item even when the batch has no remaining servings', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.leftoverStartContext = jest.fn().mockResolvedValue({ mode: 'reserved', available_servings: 2, leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, mealPlanItemId: 42, servings: 2 })).resolves.toEqual({ session });
  });

  it('rejects a source mismatch instead of resuming a recipe session as leftover', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.leftoverStartContext = jest.fn().mockResolvedValue(null);
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, servings: 2 })).rejects.toMatchObject({ response: { code: 'LEFTOVER_SOURCE_INVALID' } });
  });

  it('rejects an active recipe session when a leftover source is requested', async () => {
    const service = new CookingSessionService(repository);
    repository.recipeExists.mockResolvedValue(true);
    repository.findActive.mockResolvedValue(session);
    repository.leftoverStartContext = jest.fn().mockResolvedValue({ mode: 'direct', available_servings: 2, leftover_batch_id: 8 });
    await expect(service.start(7, { recipeId: 15, sourceType: 'leftover', leftoverBatchId: 8, servings: 1 })).rejects.toMatchObject({ response: { code: 'LEFTOVER_SOURCE_MISMATCH' } });
  });

  it('propagates a conflict when direct leftover consumption loses its atomic race', async () => {
    const service = new CookingSessionService(repository);
    repository.complete.mockRejectedValue({ response: { code: 'LEFTOVER_SERVINGS_UNAVAILABLE' } });
    await expect(service.complete(7, 31, {})).rejects.toMatchObject({ response: { code: 'LEFTOVER_SERVINGS_UNAVAILABLE' } });
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
