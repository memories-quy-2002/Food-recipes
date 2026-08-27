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
  const metadataService = {
    get: jest.fn().mockResolvedValue({ nutrition: null, allergens: [] }),
    replace: jest.fn().mockResolvedValue({ nutrition: null, allergens: [] }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns recipes with server-side pagination metadata', async () => {
    const result = {
      recipes: [{ recipe_id: 15 }],
      pagination: { page: 2, limit: 6, total: 13, totalPages: 3, hasNext: true },
    };
    repository.list.mockResolvedValue(result);
    const service = new RecipesService(repository, metadataService);

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
    const service = new RecipesService(repository, metadataService);

    await expect(service.findById(15)).resolves.toEqual({
      recipe: { ...recipe, metadata: { nutrition: null, allergens: [] } },
    });
    expect(recipe.prep_time_minutes + recipe.cook_time_minutes).toBe(
      recipe.total_time_minutes,
    );
  });

  it('allows an owner to delete a recipe', async () => {
    repository.findById.mockResolvedValue({ id: 4, user_id: 12 });
    const service = new RecipesService(repository, metadataService);

    await expect(service.delete(4, 12)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(4);
  });

  it('forbids another user from deleting a recipe', async () => {
    repository.findById.mockResolvedValue({ id: 4, user_id: 12 });
    const service = new RecipesService(repository, metadataService);

    await expect(service.delete(4, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('returns not found when the recipe does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    const service = new RecipesService(repository, metadataService);

    await expect(service.delete(404, 12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes the owner status filter to the repository', async () => {
    const result = { recipes: [{ recipe_id: 4, status: 'draft' }] };
    repository.findByUserId.mockResolvedValue(result.recipes);
    const service = new RecipesService(repository, metadataService);

    const listMine = service as unknown as {
      listMine: (userId: number, status: string) => Promise<unknown>;
    };
    await expect(listMine.listMine(12, 'draft')).resolves.toEqual(result);
    expect(repository.findByUserId).toHaveBeenCalledWith(12, 'draft');
  });

  it('creates an owned draft through the draft repository operation', async () => {
    const draft = { recipe_id: 4, status: 'draft', user_id: 12 };
    repository.createDraft.mockResolvedValue(draft);
    const service = new RecipesService(repository, metadataService);

    const createDraft = service as unknown as {
      createDraft: (userId: number, dto: unknown) => Promise<unknown>;
    };
    await expect(createDraft.createDraft(12, { name: 'Draft' })).resolves.toEqual({
      recipe: draft,
    });
    expect(repository.createDraft).toHaveBeenCalledWith(12, { name: 'Draft' });
  });

  it('rejects creating a published recipe without quantified structured ingredients', async () => {
    const service = new RecipesService(repository, metadataService);

    await expect(
      service.create(12, {
        name: 'Unquantified recipe',
        mealId: 1,
        categoryId: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        ingredients: ['a little salt'],
        instructions: ['Mix'],
        imageUrl: 'https://example.test/recipe.jpg',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'RECIPE_INGREDIENTS_QUANTITY_REQUIRED' }),
    });
    expect(repository.create).not.toHaveBeenCalled();
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
    const service = new RecipesService(repository, metadataService);
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
    const service = new RecipesService(repository, metadataService);
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

  it('rejects archived recipe base edits', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      recipe_id: 4,
      user_id: 12,
      status: 'archived',
    });
    const service = new RecipesService(repository, metadataService);

    await expect(service.update(4, 12, { name: 'Changed title' })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'RECIPE_ARCHIVED_READ_ONLY' }),
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects archived structured metadata edits', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      recipe_id: 4,
      user_id: 12,
      status: 'archived',
    });
    const service = new RecipesService(repository, metadataService);
    const lifecycle = service as unknown as {
      replaceIngredients: (id: number, userId: number, dto: unknown) => Promise<unknown>;
      replaceNutrition: (id: number, userId: number, dto: unknown) => Promise<unknown>;
      replaceTags: (id: number, userId: number, dto: unknown) => Promise<unknown>;
    };

    await expect(lifecycle.replaceIngredients(4, 12, { ingredients: [] })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'RECIPE_ARCHIVED_READ_ONLY' }),
    });
    await expect(lifecycle.replaceNutrition(4, 12, {})).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'RECIPE_ARCHIVED_READ_ONLY' }),
    });
    await expect(lifecycle.replaceTags(4, 12, { dietaryTags: [], allergenTags: [] })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'RECIPE_ARCHIVED_READ_ONLY' }),
    });
    expect(repository.replaceIngredients).not.toHaveBeenCalled();
    expect(repository.replaceNutrition).not.toHaveBeenCalled();
    expect(repository.replaceTags).not.toHaveBeenCalled();
  });

  it('allows an owner to restore an archived recipe', async () => {
    const archived = { recipe_id: 4, user_id: 12, status: 'archived' };
    const restored = { ...archived, status: 'draft' };
    repository.findByIdForOwner.mockResolvedValue(archived);
    repository.restore.mockResolvedValue(restored);
    const service = new RecipesService(repository, metadataService);
    const lifecycle = service as unknown as {
      restore: (id: number, userId: number) => Promise<unknown>;
    };

    await expect(lifecycle.restore(4, 12)).resolves.toEqual({ recipe: restored });
    expect(repository.restore).toHaveBeenCalledWith(4);
  });

  it('forbids lifecycle changes to another users recipe', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      recipe_id: 4,
      user_id: 12,
      status: 'published',
    });
    const service = new RecipesService(repository, metadataService);
    const lifecycle = service as unknown as {
      archive: (id: number, userId: number) => Promise<unknown>;
    };

    await expect(lifecycle.archive(4, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.archive).not.toHaveBeenCalled();
  });
});
