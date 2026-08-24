import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    findByIdForOwner: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    createDraft: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    replaceIngredients: jest.fn(),
    replaceNutrition: jest.fn(),
    replaceTags: jest.fn(),
    publish: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
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

  it('passes the owner status filter to the repository', async () => {
    const result = { recipes: [{ recipe_id: 4, status: 'draft' }] };
    repository.findByUserId.mockResolvedValue(result.recipes);
    const service = new RecipesService(repository);

    const listMine = service as unknown as {
      listMine: (userId: number, status: string) => Promise<unknown>;
    };
    await expect(listMine.listMine(12, 'draft')).resolves.toEqual(result);
    expect(repository.findByUserId).toHaveBeenCalledWith(12, 'draft');
  });

  it('creates an owned draft through the draft repository operation', async () => {
    const draft = { recipe_id: 4, status: 'draft', user_id: 12 };
    repository.createDraft.mockResolvedValue(draft);
    const service = new RecipesService(repository);

    const createDraft = service as unknown as {
      createDraft: (userId: number, dto: unknown) => Promise<unknown>;
    };
    await expect(createDraft.createDraft(12, { name: 'Draft' })).resolves.toEqual({
      recipe: draft,
    });
    expect(repository.createDraft).toHaveBeenCalledWith(12, { name: 'Draft' });
  });

  it('rejects publishing when the aggregate misses a required publish field', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      recipe_id: 4,
      user_id: 12,
      status: 'draft',
      recipe_name: 'Draft',
      meal_id: 1,
      category_id: 2,
      prep_time_minutes: 10,
      cook_time_minutes: 10,
      ingredients: ['Tomato'],
      instructions: ['Mix'],
      image_url: null,
      structured_ingredients: [],
    });
    const service = new RecipesService(repository);
    const lifecycle = service as unknown as {
      publish: (id: number, userId: number) => Promise<unknown>;
    };

    await expect(lifecycle.publish(4, 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.publish).not.toHaveBeenCalled();
  });

  it('rejects structured ingredient replacement when a row has no name', async () => {
    repository.findByIdForOwner.mockResolvedValue({ recipe_id: 4, user_id: 12 });
    const service = new RecipesService(repository);
    const replace = service as unknown as {
      replaceIngredients: (id: number, userId: number, dto: unknown) => Promise<unknown>;
    };

    await expect(
      replace.replaceIngredients(4, 12, {
        ingredients: [{ name: '   ' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replaceIngredients).not.toHaveBeenCalled();
  });

  it('forbids lifecycle changes to another users recipe', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      recipe_id: 4,
      user_id: 12,
      status: 'published',
    });
    const service = new RecipesService(repository);
    const lifecycle = service as unknown as {
      archive: (id: number, userId: number) => Promise<unknown>;
    };

    await expect(lifecycle.archive(4, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.archive).not.toHaveBeenCalled();
  });
});
