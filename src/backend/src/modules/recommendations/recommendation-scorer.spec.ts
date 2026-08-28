import {
  RecommendationCandidate,
  RecommendationScorer,
} from './recommendation-scorer';
import {
  RecommendationContext,
  RecommendationPantryItem,
} from './recommendation-context.service';

const createContext = (
  overrides: Partial<RecommendationContext> = {},
): RecommendationContext => ({
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
  ...overrides,
});

const createCandidate = (
  overrides: Partial<RecommendationCandidate> = {},
): RecommendationCandidate => ({
  recipeId: 15,
  authorId: 42,
  recipeName: null,
  status: 'published',
  categoryId: 3,
  mealId: 4,
  totalTimeMinutes: 30,
  averageRating: 4,
  ratingCount: 10,
  nutrition: {
    caloriesPerServing: 500,
    proteinGrams: 20,
  },
  dietaryTags: [],
  allergenTags: [],
  structuredIngredients: [{ name: 'tomatoes' }],
  legacyIngredients: [],
  ...overrides,
});

const pantryItem = (
  overrides: Partial<RecommendationPantryItem> = {},
): RecommendationPantryItem => ({
  name: 'tomatoes',
  quantity: 2,
  unit: 'PIECE',
  have: true,
  expiresAt: null,
  ...overrides,
});

describe('RecommendationScorer', () => {
  const scorer = new RecommendationScorer();

  it('excludes a recipe containing an avoided allergen before scoring', () => {
    const result = scorer.score(
      createCandidate({ allergenTags: ['peanuts'] }),
      createContext({
        preferences: {
          ...createContext().preferences,
          avoidedAllergens: new Set(['peanuts']),
        },
      }),
    );

    expect(result.excluded).toBe(true);
    expect(result.score).toBe(0);
    expect(result.reasons.join(' ')).toMatch(/allergen/i);
  });

  it('excludes allergen aliases with spaces and underscores symmetrically', () => {
    const result = scorer.score(
      createCandidate({ allergenTags: ['tree_nuts'] }),
      createContext({
        preferences: {
          ...createContext().preferences,
          avoidedAllergens: new Set(['tree nuts']),
        },
      }),
    );

    expect(result.excluded).toBe(true);
    expect(result.score).toBe(0);
  });

  it('excludes a disliked ingredient when strict dislikes are enabled', () => {
    const result = scorer.score(
      createCandidate({ structuredIngredients: [{ name: 'fresh cilantro' }] }),
      createContext({
        preferences: {
          ...createContext().preferences,
          dislikedIngredients: new Set(['cilantro']),
          strictDislikes: true,
        },
      }),
    );

    expect(result.excluded).toBe(true);
    expect(result.reasons.join(' ')).toMatch(/dislike/i);
  });

  it('raises the score when more recipe ingredients are available in the pantry', () => {
    const candidate = createCandidate({
      structuredIngredients: [{ name: 'tomatoes' }, { name: 'onions' }],
    });
    const withoutPantry = scorer.score(candidate, createContext());
    const withPantry = scorer.score(
      candidate,
      createContext({ pantry: [pantryItem(), pantryItem({ name: 'onions' })] }),
    );

    expect(withPantry.breakdown.pantryCoverage).toBeGreaterThan(
      withoutPantry.breakdown.pantryCoverage,
    );
    expect(withPantry.score).toBeGreaterThan(withoutPantry.score);
  });

  it('rewards a recipe that matches a high-protein preference', () => {
    const context = createContext({
      preferences: {
        ...createContext().preferences,
        diet: 'high-protein',
      },
    });
    const highProtein = scorer.score(
      createCandidate({ nutrition: { caloriesPerServing: 500, proteinGrams: 40 } }),
      context,
    );
    const lowProtein = scorer.score(
      createCandidate({ nutrition: { caloriesPerServing: 500, proteinGrams: 8 } }),
      context,
    );

    expect(highProtein.score).toBeGreaterThan(lowProtein.score);
    expect(highProtein.reasons.join(' ')).toMatch(/high-protein/i);
  });

  it('rewards a preferred cuisine explicitly present in the recipe name', () => {
    const context = createContext({
      preferences: {
        ...createContext().preferences,
        preferredCuisines: new Set(['japanese']),
      },
    });
    const matchingRecipe = scorer.score(
      createCandidate({ recipeName: 'Japanese Ramen' }),
      context,
    );
    const nonMatchingRecipe = scorer.score(
      createCandidate({ recipeName: 'Italian Pasta' }),
      context,
    );

    expect(matchingRecipe.breakdown.preference).toBeGreaterThan(
      nonMatchingRecipe.breakdown.preference,
    );
  });

  it('rewards a recipe within the preferred weekday cooking time', () => {
    const context = createContext({
      preferences: {
        ...createContext().preferences,
        maxWeekdayCookMinutes: 30,
      },
    });
    const shortRecipe = scorer.score(createCandidate({ totalTimeMinutes: 20 }), context);
    const longRecipe = scorer.score(createCandidate({ totalTimeMinutes: 60 }), context);

    expect(shortRecipe.score).toBeGreaterThan(longRecipe.score);
  });

  it('applies a novelty penalty to a recently cooked recipe', () => {
    const candidate = createCandidate();
    const recent = scorer.score(
      candidate,
      createContext({
        recentlyCookedRecipeIds: new Set([candidate.recipeId]),
        repeatCookCounts: new Map([[candidate.recipeId, 1]]),
      }),
    );
    const novel = scorer.score(candidate, createContext());

    expect(recent.breakdown.novelty).toBeLessThan(novel.breakdown.novelty);
    expect(recent.score).toBeLessThan(novel.score);
  });

  it('raises the waste-reduction score for an ingredient that expires soon', () => {
    const expiresSoon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const candidate = createCandidate({ structuredIngredients: [{ name: 'tomatoes' }] });
    const withoutExpiringItem = scorer.score(
      candidate,
      createContext({ pantry: [pantryItem({ expiresAt: null })] }),
    );
    const withExpiringItem = scorer.score(
      candidate,
      createContext({ pantry: [pantryItem({ expiresAt: expiresSoon })] }),
    );

    expect(withExpiringItem.breakdown.wasteReduction).toBeGreaterThan(
      withoutExpiringItem.breakdown.wasteReduction,
    );
    expect(withExpiringItem.score).toBeGreaterThan(withoutExpiringItem.score);
  });

  it('keeps the weighted score in the inclusive [0, 1] range', () => {
    const result = scorer.score(
      createCandidate({
        totalTimeMinutes: Number.MAX_SAFE_INTEGER,
        averageRating: Number.MAX_SAFE_INTEGER,
        nutrition: { caloriesPerServing: 0, proteinGrams: Number.MAX_SAFE_INTEGER },
      }),
      createContext({
        preferences: {
          ...createContext().preferences,
          maxWeekdayCookMinutes: 10,
          maxCaloriesPerServing: 100,
          minProteinGrams: 300,
        },
      }),
    );

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('always returns a non-empty human-readable reason for an eligible recipe', () => {
    const result = scorer.score(createCandidate(), createContext());

    expect(result.excluded).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.every((reason: string) => reason.trim().length > 0)).toBe(true);
  });
});
