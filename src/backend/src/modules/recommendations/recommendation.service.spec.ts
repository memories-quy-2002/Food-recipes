import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  RecommendationContext,
  RecommendationContextService,
} from './recommendation-context.service';
import {
  RecommendationCandidate,
  RecommendationCandidatesRepository,
} from './recommendation-candidates.repository';
import {
  RecommendationScore,
  RecommendationScorer,
} from './recommendation-scorer';
import {
  RECOMMENDATION_CONTEXT,
  RecommendationService,
} from './recommendation.service';
import { RECOMMENDATION_CANDIDATES_REPOSITORY } from './recommendation-candidates.repository';

const context: RecommendationContext = {
  userId: 7,
  preferences: {
    diet: null,
    avoidedAllergens: new Set(),
    dislikedIngredients: new Set(),
    preferredCuisines: new Set(),
    strictDislikes: false,
    maxWeekdayCookMinutes: null,
    maxCaloriesPerServing: null,
    minProteinGrams: null,
  },
  pantry: [],
  likedCategoryIds: new Set(),
  likedMealIds: new Set(),
  recentlyCookedRecipeIds: new Set(),
  repeatCookCounts: new Map(),
};

const candidate = (recipeId: number, authorId = 42): RecommendationCandidate => ({
  recipeId,
  authorId,
  status: 'published',
  categoryId: null,
  mealId: null,
  totalTimeMinutes: 30,
  averageRating: 4,
  ratingCount: 10,
  nutrition: null,
  dietaryTags: [],
  allergenTags: [],
  structuredIngredients: [],
  legacyIngredients: [],
});

const scored = (score: number, reasons = ['Matches your preferences.']): RecommendationScore => ({
  excluded: false,
  score,
  reasons,
  breakdown: {
    preference: score,
    pantryCoverage: 0,
    historicalAffinity: 0,
    nutritionFit: 0,
    timeFit: 0,
    quality: 0,
    novelty: 0,
    wasteReduction: 0,
  },
});

describe('RecommendationService', () => {
  it('assembles context from the authenticated preference and cooking signals', async () => {
    const preferences = {
      diet: ' vegan ',
      avoidedAllergens: [' Peanuts '],
      dislikedIngredients: ['Cilantro'],
      preferredCuisines: ['Japanese'],
      cookingSkill: 'intermediate',
      maxWeekdayCookMinutes: 30,
      defaultServings: 2,
      maxCaloriesPerServing: 650,
      minProteinGrams: 30,
      strictDislikes: true,
    };
    const preferencesService = { get: jest.fn().mockResolvedValue(preferences) };
    const pantryService = {
      list: jest.fn().mockResolvedValue({
        items: [
          {
            name: 'Tomatoes',
            quantity: 2,
            unit: 'PIECE',
            have: true,
            expiresAt: new Date('2026-08-29T00:00:00.000Z'),
          },
        ],
      }),
    };
    const historyService = {
      list: jest.fn().mockResolvedValue({
        items: [
          { recipe_id: 11, completed_at: new Date('2026-08-27T00:00:00.000Z') },
          { recipe_id: 11, completed_at: new Date('2026-08-26T00:00:00.000Z') },
          { recipe_id: 12, completed_at: new Date('2026-08-25T00:00:00.000Z') },
        ],
      }),
    };
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ category_id: 3, meal_id: 4 }]) };
    const service = new RecommendationContextService(
      preferencesService as never,
      pantryService as never,
      historyService as never,
      prisma as never,
    );

    await expect(service.build(7)).resolves.toMatchObject({
      userId: 7,
      preferences: {
        diet: 'vegan',
        avoidedAllergens: new Set(['peanuts']),
        dislikedIngredients: new Set(['cilantro']),
        preferredCuisines: new Set(['japanese']),
        strictDislikes: true,
      },
      likedCategoryIds: new Set([3]),
      likedMealIds: new Set([4]),
      recentlyCookedRecipeIds: new Set([11, 12]),
      repeatCookCounts: new Map([
        [11, 2],
        [12, 1],
      ]),
    });
    expect(preferencesService.get).toHaveBeenCalledWith(7);
    expect(pantryService.list).toHaveBeenCalledWith(7);
    expect(historyService.list).toHaveBeenCalledWith(7);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns ranked public candidates without exposing the scorer breakdown', async () => {
    const contextService = { build: jest.fn().mockResolvedValue(context) };
    const candidatesRepository = {
      listPublished: jest.fn().mockResolvedValue([candidate(2), candidate(1)]),
    };
    const scorer = {
      score: jest.fn()
        .mockReturnValueOnce(scored(0.2))
        .mockReturnValueOnce(scored(0.9, ['Uses ingredients from your pantry.'])),
    };
    const service = new RecommendationService(
      contextService as never,
      candidatesRepository as never,
      scorer as never,
    );

    await expect(service.recommend(7, { limit: 2, surface: 'home' })).resolves.toEqual([
      { recipeId: 1, score: 0.9, reasons: ['Uses ingredients from your pantry.'] },
      { recipeId: 2, score: 0.2, reasons: ['Matches your preferences.'] },
    ]);
    expect(contextService.build).toHaveBeenCalledWith(7);
    expect(candidatesRepository.listPublished).toHaveBeenCalledWith(150);
    expect(scorer.score).toHaveBeenCalledTimes(2);
  });

  it('filters exclusions before applying the requested limit', async () => {
    const contextService = { build: jest.fn().mockResolvedValue(context) };
    const candidatesRepository = {
      listPublished: jest.fn().mockResolvedValue([candidate(1), candidate(2), candidate(3)]),
    };
    const scorer = {
      score: jest.fn()
        .mockReturnValueOnce({ ...scored(0), excluded: true, reasons: ['Excluded for safety.'] })
        .mockReturnValueOnce(scored(0.5))
        .mockReturnValueOnce(scored(0.4)),
    };
    const service = new RecommendationService(
      contextService as never,
      candidatesRepository as never,
      scorer as never,
    );

    await expect(service.recommend(7, { limit: 2, surface: 'suggestions' })).resolves.toEqual([
      { recipeId: 2, score: 0.5, reasons: ['Matches your preferences.'] },
      { recipeId: 3, score: 0.4, reasons: ['Matches your preferences.'] },
    ]);
  });

  it('caps results at eight and rejects invalid input at the service boundary', async () => {
    const contextService = { build: jest.fn().mockResolvedValue(context) };
    const candidatesRepository = { listPublished: jest.fn().mockResolvedValue([]) };
    const scorer = { score: jest.fn() };
    const service = new RecommendationService(
      contextService as never,
      candidatesRepository as never,
      scorer as never,
    );

    await expect(service.recommend(7, { limit: 99, surface: 'meal-plan' })).resolves.toEqual([]);
    await expect(service.recommend(7, { limit: 0, surface: 'home' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.recommend(7, { limit: 1, surface: 'unsupported' as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(candidatesRepository.listPublished).toHaveBeenCalledWith(150);
  });
});

describe('RecommendationCandidatesRepository', () => {
  it('bulk-loads published candidate signals in one bounded query', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          recipe_id: 15,
          author_id: 42,
          category_id: 3,
          meal_id: 4,
          status: 'published',
          total_time_minutes: 30,
          average_rating: 4.5,
          rating_count: 2,
          nutrition: { caloriesPerServing: 500, proteinGrams: 30 },
          dietary_tags: ['high-protein'],
          allergen_tags: ['milk'],
          structured_ingredients: [{ name: 'chicken' }],
          legacy_ingredients: ['1 chicken breast'],
        },
      ]),
    };
    const repository = new RecommendationCandidatesRepository(prisma as never);

    await expect(repository.listPublished(500)).resolves.toMatchObject([
      {
        recipeId: 15,
        averageRating: 4.5,
        structuredIngredients: [{ name: 'chicken' }],
      },
    ]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const query = prisma.$queryRaw.mock.calls[0][0] as { strings?: readonly string[] };
    expect(query.strings?.join(' ')).toMatch(/LIMIT/);
    expect(query.strings?.join(' ')).toMatch(/recipe_ingredients/);
    expect(query.strings?.join(' ')).toMatch(/recipe_nutrition/);
    expect(query.strings?.join(' ')).toMatch(/recipe_dietary_tags/);
    expect(query.strings?.join(' ')).toMatch(/recipe_allergens/);
    expect(query.strings?.join(' ')).toMatch(/rating/);
  });
});

describe('RecommendationModule DI', () => {
  it('can resolve the recommendation service through its module providers', async () => {
    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: RECOMMENDATION_CONTEXT, useValue: { build: jest.fn() } },
        { provide: RECOMMENDATION_CANDIDATES_REPOSITORY, useValue: { listPublished: jest.fn() } },
        RecommendationScorer,
      ],
    }).compile();

    expect(module.get(RecommendationService)).toBeInstanceOf(RecommendationService);
    await module.close();
  });
});
