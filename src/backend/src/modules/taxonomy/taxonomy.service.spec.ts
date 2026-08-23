import { TaxonomyService } from './taxonomy.service';

describe('TaxonomyService', () => {
  it('returns the category catalog from the repository', async () => {
    const repository = {
      listCategories: jest.fn().mockResolvedValue({
        categories: [{ id: 1, name: 'Main', recipe_count: 4 }],
      }),
      listMeals: jest.fn(),
    };
    const service = new TaxonomyService(repository);

    await expect(service.listCategories()).resolves.toEqual({
      categories: [{ id: 1, name: 'Main', recipe_count: 4 }],
    });
    expect(repository.listCategories).toHaveBeenCalledTimes(1);
  });

  it('returns the meal catalog from the repository', async () => {
    const repository = {
      listCategories: jest.fn(),
      listMeals: jest.fn().mockResolvedValue({
        meals: [{ id: 1, name: 'Breakfast', description: null, recipe_count: 2 }],
      }),
    };
    const service = new TaxonomyService(repository);

    await expect(service.listMeals()).resolves.toEqual({
      meals: [{ id: 1, name: 'Breakfast', description: null, recipe_count: 2 }],
    });
    expect(repository.listMeals).toHaveBeenCalledTimes(1);
  });
});
