import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SavedPlanningService, SavedPlanningRepositoryPort } from './saved-planning.service';

const repository = (): jest.Mocked<SavedPlanningRepositoryPort> => ({
  createTemplate: jest.fn(),
  listTemplates: jest.fn(),
  findTemplate: jest.fn(),
  findOwnedPlan: jest.fn(),
  createTemplateItems: jest.fn(),
  listTemplateItems: jest.fn(),
  createPlanItemsFromTemplate: jest.fn(),
  createRecurringRule: jest.fn(),
  listRecurringRules: jest.fn(),
  deleteRecurringRule: jest.fn(),
  recipeExists: jest.fn(),
  listPlanItemsForTemplate: jest.fn(),
});

describe('SavedPlanningService', () => {
  it('saves a plan as a relative-day template', async () => {
    const repo = repository();
    repo.findOwnedPlan.mockResolvedValue({ id: 7, name: 'Family week', start_date: '2026-08-24', end_date: '2026-08-30' });
    repo.listPlanItemsForTemplate.mockResolvedValue([
      { recipe_id: 11, planned_date: '2026-08-24', slot: 'dinner', servings: 4 },
      { recipe_id: 12, planned_date: '2026-08-26', slot: 'lunch', servings: 2 },
    ]);
    repo.createTemplate.mockResolvedValue({ id: 3, name: 'Family week', duration_days: 7 });

    const result = await new SavedPlanningService(repo).saveTemplate(42, { planId: 7 });

    expect(repo.createTemplate).toHaveBeenCalledWith(42, 'Family week', 7);
    expect(repo.createTemplateItems).toHaveBeenCalledWith(3, [
      { relative_day: 0, recipe_id: 11, slot: 'dinner', servings: 4 },
      { relative_day: 2, recipe_id: 12, slot: 'lunch', servings: 2 },
    ]);
    expect(result).toEqual({ template: { id: 3, name: 'Family week', duration_days: 7 } });
  });

  it('applies template items from the target start date', async () => {
    const repo = repository();
    repo.findTemplate.mockResolvedValue({ id: 3, name: 'Family week', duration_days: 7 });
    repo.findOwnedPlan.mockResolvedValue({ id: 9, name: 'Next week', start_date: '2026-09-07', end_date: '2026-09-13' });
    repo.listTemplateItems.mockResolvedValue([
      { relative_day: 0, recipe_id: 11, slot: 'dinner', servings: 4 },
      { relative_day: 2, recipe_id: 12, slot: 'lunch', servings: 2 },
    ]);

    const result = await new SavedPlanningService(repo).applyTemplate(42, 3, { planId: 9, from: '2026-09-07', to: '2026-09-13' });

    expect(repo.createPlanItemsFromTemplate).toHaveBeenCalledWith(9, [
      { recipe_id: 11, date: '2026-09-07', slot: 'dinner', servings: 4 },
      { recipe_id: 12, date: '2026-09-09', slot: 'lunch', servings: 2 },
    ]);
    expect(result).toEqual({ applied: 2, plan_id: 9, from: '2026-09-07', to: '2026-09-13' });
  });

  it('rejects applying a template outside the target plan range', async () => {
    const repo = repository();
    repo.findTemplate.mockResolvedValue({ id: 3, name: 'Family week', duration_days: 7 });
    repo.findOwnedPlan.mockResolvedValue({ id: 9, name: 'Next week', start_date: '2026-09-07', end_date: '2026-09-13' });

    await expect(new SavedPlanningService(repo).applyTemplate(42, 3, { planId: 9, from: '2026-09-06', to: '2026-09-12' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repo.createPlanItemsFromTemplate).not.toHaveBeenCalled();
  });

  it('creates a recurring rule only for an existing recipe', async () => {
    const repo = repository();
    repo.recipeExists.mockResolvedValue(true);
    repo.createRecurringRule.mockResolvedValue({ id: 4, weekday: 1, slot: 'dinner', recipe_id: 11, servings: 3 });

    await expect(new SavedPlanningService(repo).createRecurringRule(42, { weekday: 1, slot: 'dinner', recipeId: 11, servings: 3 }))
      .resolves.toEqual({ rule: { id: 4, weekday: 1, slot: 'dinner', recipe_id: 11, servings: 3 } });
  });

  it('returns not found when deleting another user\'s recurring rule', async () => {
    const repo = repository();
    repo.deleteRecurringRule.mockResolvedValue(false);

    await expect(new SavedPlanningService(repo).deleteRecurringRule(42, 99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
