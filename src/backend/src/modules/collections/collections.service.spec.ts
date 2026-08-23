import { ConflictException, NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import type { CollectionsRepositoryPort } from './collections.repository';

describe('CollectionsService', () => {
  const collection = {
    collection_id: 4,
    name: 'Weeknight dinners',
    recipe_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const repository: jest.Mocked<CollectionsRepositoryPort> = {
    listByUserId: jest.fn(),
    findOwned: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    recipeExists: jest.fn(),
    recipeInCollection: jest.fn(),
    addRecipe: jest.fn(),
    removeRecipe: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('trims collection names before persistence', async () => {
    repository.create.mockResolvedValue(collection);
    const service = new CollectionsService(repository);

    await service.create(7, { name: '  Weeknight dinners  ' });

    expect(repository.create).toHaveBeenCalledWith(7, 'Weeknight dinners');
  });

  it('maps a database duplicate-name conflict to a stable API conflict', async () => {
    repository.create.mockRejectedValue(new Error('saved_collections_user_name_key'));
    const service = new CollectionsService(repository);

    await expect(service.create(7, { name: 'Weeknight dinners' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not allow a foreign collection to receive a recipe', async () => {
    repository.findOwned.mockResolvedValue(null);
    const service = new CollectionsService(repository);

    await expect(service.addRecipe(8, 4, { recipeId: 15 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.addRecipe).not.toHaveBeenCalled();
  });

  it('rejects duplicate recipe membership deterministically', async () => {
    repository.findOwned.mockResolvedValue(collection);
    repository.recipeExists.mockResolvedValue(true);
    repository.recipeInCollection.mockResolvedValue(true);
    const service = new CollectionsService(repository);

    await expect(service.addRecipe(7, 4, { recipeId: 15 })).rejects.toMatchObject({ response: { code: 'COLLECTION_RECIPE_EXISTS' } });
  });
});
