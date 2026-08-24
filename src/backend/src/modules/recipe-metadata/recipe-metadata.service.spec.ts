import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  RecipeMetadataRepositoryPort,
  RecipeMetadataRecord,
} from './recipe-metadata.repository';
import { RecipeMetadataService } from './recipe-metadata.service';

describe('RecipeMetadataService', () => {
  const repository: jest.Mocked<RecipeMetadataRepositoryPort> = {
    recipeOwnerId: jest.fn(),
    findByRecipeId: jest.fn(),
    replace: jest.fn(),
  };
  const emptyMetadata: RecipeMetadataRecord = { nutrition: null, allergens: [] };

  beforeEach(() => jest.clearAllMocks());

  it('returns explicitly stored metadata without inferring missing values', async () => {
    repository.recipeOwnerId.mockResolvedValue(7);
    repository.findByRecipeId.mockResolvedValue(emptyMetadata);
    const service = new RecipeMetadataService(repository);

    await expect(service.get(15)).resolves.toEqual(emptyMetadata);
    expect(repository.findByRecipeId).toHaveBeenCalledWith(15);
  });

  it('rejects metadata writes for a recipe owned by another user', async () => {
    repository.recipeOwnerId.mockResolvedValue(7);
    const service = new RecipeMetadataService(repository);

    await expect(
      service.replace(15, 99, { nutrition: null, allergens: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('rejects metadata writes for a missing recipe', async () => {
    repository.recipeOwnerId.mockResolvedValue(null);
    const service = new RecipeMetadataService(repository);

    await expect(
      service.replace(404, 7, { nutrition: null, allergens: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires an external reference for verified metadata', async () => {
    repository.recipeOwnerId.mockResolvedValue(7);
    const service = new RecipeMetadataService(repository);

    await expect(
      service.replace(15, 7, {
        nutrition: {
          caloriesPerServing: 400,
          source: 'verified_external',
        },
        allergens: [],
      }),
    ).rejects.toThrow('source reference');
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('requires an external reference for verified allergen metadata', async () => {
    repository.recipeOwnerId.mockResolvedValue(7);
    const service = new RecipeMetadataService(repository);

    await expect(
      service.replace(15, 7, {
        nutrition: null,
        allergens: [{ name: 'peanuts', source: 'verified_external' }],
      }),
    ).rejects.toThrow('source reference');
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('trims source references before persisting manually entered metadata', async () => {
    repository.recipeOwnerId.mockResolvedValue(7);
    repository.replace.mockResolvedValue(emptyMetadata);
    const service = new RecipeMetadataService(repository);

    await service.replace(15, 7, {
      nutrition: {
        caloriesPerServing: 400,
        source: 'provided_by_author',
        sourceReference: '  Recipe card  ',
      },
      allergens: [
        {
          name: 'peanuts',
          source: 'provided_by_author',
          sourceReference: '  Label checked  ',
        },
      ],
    });

    expect(repository.replace).toHaveBeenCalledWith(
      15,
      expect.objectContaining({ sourceReference: 'Recipe card' }),
      [expect.objectContaining({ sourceReference: 'Label checked' })],
    );
  });
});
