import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  SuggestionsRepositoryPort,
  SuggestionResult,
} from './suggestions.repository';
import { SuggestionsService } from './suggestions.service';

describe('SuggestionsService', () => {
  const repository: jest.Mocked<SuggestionsRepositoryPort> = {
    findByIngredients: jest.fn(),
    findPersonalized: jest.fn(),
    findForMealPlan: jest.fn(),
    findBySubstituteIngredient: jest.fn(),
  };
  const result: SuggestionResult[] = [
    {
      recipe_id: 15,
      recipe_name: 'Pho',
      recipe_description: 'Soup',
      image_url: null,
      match_score: 1,
      reason: '',
    },
  ];
  const substitutionResult = [{ ...result[0], reason: 'Uses the requested ingredient.' }];

  beforeEach(() => jest.clearAllMocks());

  it('returns catalog-backed ingredient suggestions with an advisory source', async () => {
    repository.findByIngredients.mockResolvedValue(result);
    const service = new SuggestionsService(repository);

    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: ['  chicken '] }),
    ).resolves.toMatchObject({ source: 'catalog_rules', suggestions: [{ reason: 'Matches 1 supplied ingredient.' }] });
    expect(repository.findByIngredients).toHaveBeenCalledWith(['chicken']);
  });

  it('requires a user for personalized and meal-plan suggestions', async () => {
    const service = new SuggestionsService(repository);

    await expect(service.suggest({ intent: 'personalized' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.suggest({ intent: 'meal_plan' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('keeps substitution suggestions read-only and bounded to a recipe ingredient', async () => {
    repository.findBySubstituteIngredient.mockResolvedValue(substitutionResult);
    const service = new SuggestionsService(repository);

    await expect(
      service.suggest({ intent: 'substitution', recipeId: 15, ingredient: 'milk' }),
    ).resolves.toMatchObject({ suggestions: substitutionResult });
    expect(repository.findBySubstituteIngredient).toHaveBeenCalledWith(15, 'milk');
  });

  it('rejects unbounded or empty ingredient input before querying', async () => {
    const service = new SuggestionsService(repository);

    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: Array.from({ length: 11 }, () => 'x') }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findByIngredients).not.toHaveBeenCalled();
  });
});
