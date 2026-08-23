import { TaxonomyController } from './taxonomy.controller';

describe('TaxonomyController', () => {
  it('exposes the legacy category response', async () => {
    const service = {
      listCategories: jest.fn().mockResolvedValue({
        categories: [{ id: 1, name: 'Main', recipe_count: 1 }],
      }),
      listMeals: jest.fn(),
    };
    const controller = new TaxonomyController(service);

    await expect(controller.listCategories()).resolves.toEqual({
      categories: [{ id: 1, name: 'Main', recipe_count: 1 }],
    });
  });

  it('exposes the legacy meal response', async () => {
    const service = {
      listCategories: jest.fn(),
      listMeals: jest.fn().mockResolvedValue({
        meals: [{ id: 1, name: 'Breakfast', description: null, recipe_count: 1 }],
      }),
    };
    const controller = new TaxonomyController(service);

    await expect(controller.listMeals()).resolves.toEqual({
      meals: [{ id: 1, name: 'Breakfast', description: null, recipe_count: 1 }],
    });
  });
});
