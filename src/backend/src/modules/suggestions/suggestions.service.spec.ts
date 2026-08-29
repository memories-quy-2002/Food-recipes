import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  SuggestionsRepositoryPort,
  SuggestionResult,
} from './suggestions.repository';
import { RecommendationServicePort } from '../recommendations/recommendation.service';
import { SuggestionsService } from './suggestions.service';

describe('SuggestionsService', () => {
  type SuggestionsRepositoryMock = jest.Mocked<SuggestionsRepositoryPort> & {
    findByRecipeIds: jest.MockedFunction<(recipeIds: number[]) => Promise<SuggestionResult[]>>;
  };
  const repository = {
    findByIngredients: jest.fn(),
    findPersonalized: jest.fn(),
    findForMealPlan: jest.fn(),
    findBySubstituteIngredient: jest.fn(),
    findByRecipeIds: jest.fn(),
  } as SuggestionsRepositoryMock;
  const recommendationService: jest.Mocked<RecommendationServicePort> = {
    recommend: jest.fn(),
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

  const createService = () => new SuggestionsService(repository, recommendationService);

  it('returns catalog-backed ingredient suggestions with an advisory source', async () => {
    repository.findByIngredients.mockResolvedValue(result);
    const service = createService();

    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: ['  chicken '] }),
    ).resolves.toMatchObject({ source: 'catalog_rules', suggestions: [{ reason: 'Matches 1 supplied ingredient.' }] });
    expect(repository.findByIngredients).toHaveBeenCalledWith(['chicken']);
  });

  it('delegates authenticated personalized suggestions and preserves the legacy response fields', async () => {
    recommendationService.recommend.mockResolvedValue([
      {
        recipeId: 15,
        score: 0.83,
        reasons: ['Matches your preferences.', 'Uses ingredients from your pantry.'],
      },
    ]);
    repository.findByRecipeIds.mockResolvedValue(result);
    const service = createService();

    await expect(service.suggest({ intent: 'personalized' }, 7)).resolves.toEqual({
      intent: 'personalized',
      source: 'catalog_rules',
      disclaimer: expect.any(String),
      suggestions: [
        {
          recipe_id: 15,
          recipe_name: 'Pho',
          recipe_description: 'Soup',
          image_url: null,
          match_score: 0.83,
          reason: 'Matches your preferences. Uses ingredients from your pantry.',
        },
      ],
    });
    expect(recommendationService.recommend).toHaveBeenCalledWith(7, { limit: 6, surface: 'suggestions' });
    expect(repository.findByRecipeIds).toHaveBeenCalledWith([15]);
    expect(repository.findPersonalized).not.toHaveBeenCalled();
  });

  it('delegates authenticated meal-plan suggestions to the meal-plan surface', async () => {
    recommendationService.recommend.mockResolvedValue([
      { recipeId: 15, score: 0.7, reasons: ['Fits your meal plan.'] },
    ]);
    repository.findByRecipeIds.mockResolvedValue(result);
    const service = createService();

    await service.suggest({ intent: 'meal_plan' }, 7);

    expect(recommendationService.recommend).toHaveBeenCalledWith(7, { limit: 6, surface: 'meal-plan' });
    expect(repository.findByRecipeIds).toHaveBeenCalledWith([15]);
    expect(repository.findForMealPlan).not.toHaveBeenCalled();
  });

  it('requires a user for personalized and meal-plan suggestions', async () => {
    const service = createService();

    await expect(service.suggest({ intent: 'personalized' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.suggest({ intent: 'meal_plan' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(recommendationService.recommend).not.toHaveBeenCalled();
  });

  it('keeps substitution suggestions read-only and bounded to a recipe ingredient', async () => {
    repository.findBySubstituteIngredient.mockResolvedValue(substitutionResult);
    const service = createService();

    await expect(
      service.suggest({ intent: 'substitution', recipeId: 15, ingredient: 'milk' }),
    ).resolves.toMatchObject({ suggestions: substitutionResult });
    expect(repository.findBySubstituteIngredient).toHaveBeenCalledWith(15, 'milk');
  });

  it('rejects unbounded or empty ingredient input before querying', async () => {
    const service = createService();

    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.suggest({ intent: 'ingredient_match', ingredients: Array.from({ length: 11 }, () => 'x') }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findByIngredients).not.toHaveBeenCalled();
  });
});
