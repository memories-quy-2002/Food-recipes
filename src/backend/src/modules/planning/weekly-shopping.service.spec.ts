import { ConflictException, NotFoundException } from '@nestjs/common';
import { WeeklyShoppingService } from './weekly-shopping.service';

const plan = {
  plan_id: 9, name: 'Week', start_date: '2026-11-16', end_date: '2026-11-22',
  created_at: new Date('2026-11-01'), updated_at: new Date('2026-11-01'),
};
const meal = {
  item_id: 22, plan_id: 9, recipe_id: 12, recipe_name: 'Soup', source_type: 'recipe',
  leftover_batch_id: null, planned_date: '2026-11-16', slot: 'lunch', servings: 3,
  cooking_status: 'planned', created_at: new Date('2026-11-01'),
};
const prepared = {
  recipe_id: 12, recipe_name: 'Soup', servings: 3,
  ingredients: [{
    position: 0, ingredient_name: 'Potato', required_quantity: 600,
    required_unit: 'GRAM', available_quantity: 200,
    missing_quantity: 400, pantry_id: 5, status: 'missing',
  }], added_shopping_items: 0, shopping_list_confirmed: false,
};

const selectedWeek = { planId: 9, from: '2026-11-16', to: '2026-11-22' };

describe('WeeklyShoppingService', () => {
  const repository = {
    findPlan: jest.fn(), findPlanForHousehold: jest.fn(),
    listPlanItems: jest.fn(), listPlanItemsForHousehold: jest.fn(),
    prepareRecipeIngredients: jest.fn(), listShoppingItems: jest.fn(),
    listShoppingItemsForHousehold: jest.fn(),
  };
  const writer = { addItems: jest.fn() };
  const service = new WeeklyShoppingService(repository as never, writer as never);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.findPlan.mockResolvedValue(plan);
    repository.findPlanForHousehold.mockResolvedValue(plan);
    repository.listPlanItems.mockResolvedValue([meal]);
    repository.listPlanItemsForHousehold.mockResolvedValue([meal]);
    repository.prepareRecipeIngredients.mockResolvedValue(prepared);
    repository.listShoppingItems.mockResolvedValue([]);
    repository.listShoppingItemsForHousehold.mockResolvedValue([]);
    writer.addItems.mockResolvedValue(1);
  });

  it('previews without writing and accounts for the planned serving count', async () => {
    const result = await service.preview(7, selectedWeek);
    expect(result.items[0]).toMatchObject({ name: 'Potato', quantity: '400 g' });
    expect(repository.prepareRecipeIngredients).toHaveBeenCalledWith(7, 12, 3, undefined);
    expect(writer.addItems).not.toHaveBeenCalled();
  });

  it('rejects an unowned plan', async () => {
    repository.findPlan.mockResolvedValue(null);
    await expect(service.preview(7, selectedWeek)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a stale preview before writing any shopping data', async () => {
    await expect(service.confirm(7, { ...selectedWeek, snapshot: 'stale' })).rejects.toBeInstanceOf(ConflictException);
    expect(writer.addItems).not.toHaveBeenCalled();
  });

  it('confirms a fresh preview using the existing scoped shopping writer', async () => {
    const preview = await service.preview(7, selectedWeek, 4);
    const result = await service.confirm(7, { ...selectedWeek, snapshot: preview.snapshot }, 4);
    expect(writer.addItems).toHaveBeenCalledWith(7, 4, [expect.objectContaining({
      name: 'Potato', quantity: '400 g',
    })]);
    expect(result.addedShoppingItems).toBe(1);
  });

  it('does not write when all required lines are already listed', async () => {
    repository.listShoppingItems.mockResolvedValue([{ item_id: 1, label: 'Potato', quantity: '400 g', checked: false }]);
    const preview = await service.preview(7, selectedWeek);
    const result = await service.confirm(7, { ...selectedWeek, snapshot: preview.snapshot });
    expect(result.addedShoppingItems).toBe(0);
    expect(writer.addItems).not.toHaveBeenCalled();
  });

  it('does not include meals beyond the selected week', async () => {
    repository.listPlanItems.mockResolvedValue([
      meal, { ...meal, item_id: 23, planned_date: '2026-11-23' },
    ]);
    const preview = await service.preview(7, selectedWeek);
    expect(preview.mealCount).toBe(1);
    expect(repository.prepareRecipeIngredients).toHaveBeenCalledTimes(1);
  });
});
