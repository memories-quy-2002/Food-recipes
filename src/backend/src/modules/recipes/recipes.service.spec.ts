import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns recipes with server-side pagination metadata', async () => {
    const result = {
      recipes: [{ recipe_id: 15 }],
      pagination: { page: 2, limit: 6, total: 13, totalPages: 3, hasNext: true },
    };
    repository.list.mockResolvedValue(result);
    const service = new RecipesService(repository);

    await expect(service.list({ page: 2, limit: 6 })).resolves.toEqual(result);
    expect(repository.list).toHaveBeenCalledWith({ page: 2, limit: 6 });
  });

  it('returns the native minute duration contract including total time', async () => {
    const recipe = {
      prep_time_minutes: 15,
      cook_time_minutes: 90,
      total_time_minutes: 105,
    };
    repository.findById.mockResolvedValue(recipe);
    const service = new RecipesService(repository);

    await expect(service.findById(15)).resolves.toEqual({ recipe });
    expect(recipe.prep_time_minutes + recipe.cook_time_minutes).toBe(
      recipe.total_time_minutes,
    );
  });

  it('allows an owner to delete a recipe', async () => {
    repository.findById.mockResolvedValue({ id: 4, user_id: 12 });
    const service = new RecipesService(repository);

    await expect(service.delete(4, 12)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(4);
  });

  it('forbids another user from deleting a recipe', async () => {
    repository.findById.mockResolvedValue({ id: 4, user_id: 12 });
    const service = new RecipesService(repository);

    await expect(service.delete(4, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('returns not found when the recipe does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    const service = new RecipesService(repository);

    await expect(service.delete(404, 12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
