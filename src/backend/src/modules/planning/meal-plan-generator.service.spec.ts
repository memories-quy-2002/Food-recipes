import { BadRequestException } from '@nestjs/common';
import { RecommendationScorer } from '../recommendations/recommendation-scorer';
import type { RecommendationCandidate } from '../recommendations/recommendation-candidates.repository';
import type { RecommendationContext } from '../recommendations/recommendation-context.service';
import type { PlanningRepositoryPort } from './planning.repository';
import { MealPlanGeneratorService } from './meal-plan-generator.service';

const context = (overrides: Partial<RecommendationContext> = {}): RecommendationContext => ({
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
  asOf: new Date('2026-08-24T00:00:00.000Z'),
  ...overrides,
});

const candidate = (recipeId: number, overrides: Partial<RecommendationCandidate> = {}): RecommendationCandidate => ({
  recipeId,
  authorId: 42,
  recipeName: `Recipe ${recipeId}`,
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
  ...overrides,
});

const repository = () => ({
  createPlan: jest.fn().mockResolvedValue({ plan_id: 10, name: 'Week', start_date: '2026-08-24', end_date: '2026-08-30', created_at: new Date(), updated_at: new Date() }),
  addPlanItem: jest.fn().mockImplementation(async (_userId, planId, recipeId, date, slot, servings) => ({ item_id: recipeId, plan_id: planId, recipe_id: recipeId, recipe_name: `Recipe ${recipeId}`, planned_date: date, slot, servings, cooking_status: 'planned', created_at: new Date() })),
});

const input = (overrides: Record<string, unknown> = {}) => ({
  name: 'Week',
  from: '2026-08-24',
  to: '2026-08-30',
  targetMeals: 2,
  slots: [
    { date: '2026-08-24', slot: 'dinner', servings: 2 },
    { date: '2026-08-25', slot: 'dinner', servings: 2 },
  ],
  ...overrides,
}) as never;

describe('MealPlanGeneratorService', () => {
  it('never selects a recipe containing an avoided allergen', async () => {
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context({ preferences: { ...context().preferences, avoidedAllergens: new Set(['peanuts']) } })) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1, { allergenTags: ['peanuts'] }), candidate(2)]) },
      new RecommendationScorer(),
      repository() as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    const result = await service.generatePreview(7, input());

    expect(result.items.map((item) => item.recipeId)).toEqual([2, 2]);
  });

  it('preserves a valid locked item', async () => {
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context()) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1), candidate(2)]) },
      new RecommendationScorer(),
      repository() as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    const result = await service.generatePreview(7, input({ lockedItems: [{ date: '2026-08-24', slot: 'dinner', servings: 2, recipeId: 2 }] }));

    expect(result.items[0]).toMatchObject({ recipeId: 2, locked: true });
  });

  it('avoids duplicate recipes when alternatives exist', async () => {
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context()) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1), candidate(2)]) },
      new RecommendationScorer(),
      repository() as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    const result = await service.generatePreview(7, input());

    expect(result.items.map((item) => item.recipeId)).toEqual([1, 2]);
  });

  it('respects the requested meal count', async () => {
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context()) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1), candidate(2), candidate(3)]) },
      new RecommendationScorer(),
      repository() as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    const result = await service.generatePreview(7, input({ targetMeals: 3, slots: undefined }));

    expect(result.items).toHaveLength(3);
  });

  it('returns a stable error when a plan cannot be generated', async () => {
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context({ preferences: { ...context().preferences, avoidedAllergens: new Set(['peanuts']) } })) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1, { allergenTags: ['peanuts'] })]) },
      new RecommendationScorer(),
      repository() as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    await expect(service.generatePreview(7, input())).rejects.toMatchObject({ response: { code: 'MEAL_PLAN_GENERATION_IMPOSSIBLE' } });
  });

  it('revalidates server preview items and ignores manipulated client recipe IDs', async () => {
    const persistence = repository();
    const service = new MealPlanGeneratorService(
      { build: jest.fn().mockResolvedValue(context()) },
      { listPublished: jest.fn().mockResolvedValue([candidate(1), candidate(2)]) },
      new RecommendationScorer(),
      persistence as unknown as Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>,
    );

    const preview = await service.generatePreview(7, input({ targetMeals: 1, slots: [{ date: '2026-08-24', slot: 'dinner', servings: 2 }] }));
    await service.createFromPreview(7, { previewToken: preview.previewToken, items: [{ ...preview.items[0], recipeId: 999 }] } as never);

    expect(persistence.addPlanItem).toHaveBeenCalledWith(7, 10, preview.items[0].recipeId, '2026-08-24', 'dinner', 2);
    expect(persistence.addPlanItem).not.toHaveBeenCalledWith(7, 10, 999, expect.anything(), expect.anything(), expect.anything());
  });
});
