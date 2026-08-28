import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlanningService } from './planning.service';
import type { PlanningRepositoryPort } from './planning.repository';

describe('PlanningService', () => {
  const repository: jest.Mocked<PlanningRepositoryPort> = {
    listPlans: jest.fn(),
    findPlan: jest.fn(),
    createPlan: jest.fn(),
    updatePlan: jest.fn(),
    deletePlan: jest.fn(),
    listPlansForHousehold: jest.fn(),
    findPlanForHousehold: jest.fn(),
    createPlanForHousehold: jest.fn(),
    updatePlanForHousehold: jest.fn(),
    deletePlanForHousehold: jest.fn(),
    listPlanItems: jest.fn(),
    findPlanItem: jest.fn(),
    recipeExists: jest.fn(),
    addPlanItem: jest.fn(),
    updatePlanItem: jest.fn(),
    deletePlanItem: jest.fn(),
    listPlanItemsForHousehold: jest.fn(),
    findPlanItemForHousehold: jest.fn(),
    addPlanItemForHousehold: jest.fn(),
    updatePlanItemForHousehold: jest.fn(),
    deletePlanItemForHousehold: jest.fn(),
    listShoppingItems: jest.fn(),
    addShoppingItem: jest.fn(),
    updateShoppingItem: jest.fn(),
    deleteShoppingItem: jest.fn(),
    listShoppingItemsForHousehold: jest.fn(),
    addShoppingItemForHousehold: jest.fn(),
    updateShoppingItemForHousehold: jest.fn(),
    deleteShoppingItemForHousehold: jest.fn(),
    recipeIngredients: jest.fn(),
    prepareRecipeIngredients: jest.fn(),
    clearCompletedShoppingItems: jest.fn(),
    clearCompletedShoppingItemsForHousehold: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects meal plans longer than 31 inclusive days', async () => {
    const service = new PlanningService(repository);

    await expect(service.createPlan(7, { name: 'Too long', from: '2026-08-01', to: '2026-09-01' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a plan item outside the owned plan range', async () => {
    repository.findPlan.mockResolvedValue({ plan_id: 4, name: 'Week', start_date: '2026-08-01', end_date: '2026-08-07', created_at: new Date(), updated_at: new Date() });
    const service = new PlanningService(repository);

    await expect(service.addPlanItem(7, 4, { recipeId: 15, date: '2026-08-08', slot: 'dinner', servings: 2 })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.addPlanItem).not.toHaveBeenCalled();
  });

  it('copies each recipe ingredient as a separate shopping item', async () => {
    repository.recipeIngredients.mockResolvedValue({ name: 'Pasta', ingredients: ['200 g pasta', '2 eggs'] });
    repository.addShoppingItem.mockImplementation(async (_userId, label, _quantity, sourceRecipeId) => ({
      item_id: label === '200 g pasta' ? 1 : 2,
      label,
      quantity: null,
      source_recipe_id: sourceRecipeId,
      source_recipe_name: 'Pasta',
      checked: false,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    const service = new PlanningService(repository);

    await service.addRecipeIngredients(7, 15);

    expect(repository.addShoppingItem).toHaveBeenNthCalledWith(1, 7, '200 g pasta', null, 15);
    expect(repository.addShoppingItem).toHaveBeenNthCalledWith(2, 7, '2 eggs', null, 15);
  });

  it('returns 404 when adding ingredients from a missing recipe', async () => {
    repository.recipeIngredients.mockResolvedValue(null);
    const service = new PlanningService(repository);

    await expect(service.addRecipeIngredients(7, 999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates meal preparation to the owned pantry-aware repository flow', async () => {
    const prepared = {
      recipe_id: 15,
      recipe_name: 'Pasta',
      servings: 4,
      ingredients: [{ ingredient_name: 'tomatoes', status: 'missing' }],
      added_shopping_items: 1,
    } as never;
    repository.prepareRecipeIngredients.mockResolvedValue(prepared);
    const service = new PlanningService(repository);

    await expect(service.prepareRecipeIngredients(7, 15, 4)).resolves.toBe(prepared);
    expect(repository.prepareRecipeIngredients).toHaveBeenCalledWith(7, 15, 4);
  });

  it('rejects preparation for a recipe that is not published or does not exist', async () => {
    repository.prepareRecipeIngredients.mockResolvedValue(null);
    const service = new PlanningService(repository);

    await expect(service.prepareRecipeIngredients(7, 999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('consolidates compatible structured ingredients across recipes', async () => {
    repository.recipeIngredients
      .mockResolvedValueOnce({ name: 'Pasta', ingredients: [], structuredIngredients: [{ name: 'eggs', quantity: 2, unit: 'PIECE', note: null, position: 0 }] })
      .mockResolvedValueOnce({ name: 'Omelette', ingredients: [], structuredIngredients: [{ name: 'eggs', quantity: 3, unit: 'PIECE', note: null, position: 0 }] });
    repository.addShoppingItem.mockResolvedValue({
      item_id: 1,
      label: 'eggs',
      quantity: '5 piece',
      source_recipe_id: 15,
      source_recipe_name: 'Pasta',
      checked: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const service = new PlanningService(repository);

    await service.addRecipeIngredientsFromRecipes(7, [15, 16]);

    expect(repository.addShoppingItem).toHaveBeenCalledWith(7, 'eggs', '5 piece', 15);
  });
});
