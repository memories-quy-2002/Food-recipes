import { Injectable } from '@nestjs/common';
import type {
  RecommendationCandidate,
  RecommendationNutrition,
} from './recommendation-candidates.repository';
import type {
  RecommendationContext,
  RecommendationPantryItem,
} from './recommendation-context.service';

export type RecommendationBreakdown = {
  preference: number;
  pantryCoverage: number;
  historicalAffinity: number;
  nutritionFit: number;
  timeFit: number;
  quality: number;
  novelty: number;
  wasteReduction: number;
};

export type RecommendationScore = {
  excluded: boolean;
  score: number;
  reasons: string[];
  breakdown: RecommendationBreakdown;
};

export type RecommendationScoreOptions = {
  excludeOwnRecipe?: boolean;
};

const WEIGHTS = {
  preference: 0.18,
  pantryCoverage: 0.2,
  historicalAffinity: 0.14,
  nutritionFit: 0.1,
  timeFit: 0.1,
  quality: 0.08,
  novelty: 0.08,
  wasteReduction: 0.12,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeText = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? '';

const clamp = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

const toDay = (value: Date): number => {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth();
  const date = value.getUTCDate();
  return Date.UTC(year, month, date);
};

const ingredientNames = (candidate: RecommendationCandidate): string[] => [
  ...candidate.structuredIngredients.map((ingredient) => ingredient.name),
  ...candidate.legacyIngredients,
];

const matches = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  return Boolean(normalizedLeft && normalizedRight) &&
    (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft));
};

const matchedPantryItems = (
  candidate: RecommendationCandidate,
  pantry: readonly RecommendationPantryItem[],
  asOf: Date,
): RecommendationPantryItem[] => {
  const today = toDay(asOf);
  const names = ingredientNames(candidate);
  return pantry.filter((item) => {
    if (!item.have || (item.quantity !== null && item.quantity <= 0)) return false;
    if (item.expiresAt && toDay(item.expiresAt) < today) return false;
    return names.some((name) => matches(name, item.name));
  });
};

const expiringPantryItems = (
  pantry: readonly RecommendationPantryItem[],
  asOf: Date,
): RecommendationPantryItem[] => {
  const today = toDay(asOf);
  return pantry.filter((item) => {
    if (!item.have || (item.quantity !== null && item.quantity <= 0) || !item.expiresAt) return false;
    const daysUntilExpiry = (toDay(item.expiresAt) - today) / DAY_MS;
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
  });
};

const ingredientMatches = (
  candidate: RecommendationCandidate,
  pantryItems: readonly RecommendationPantryItem[],
): RecommendationPantryItem[] => {
  const names = ingredientNames(candidate);
  return pantryItems.filter((item) => names.some((name) => matches(name, item.name)));
};

const nutritionFit = (
  nutrition: RecommendationNutrition | null,
  maxCalories: number | null,
  minProtein: number | null,
): number => {
  const components: number[] = [];
  if (maxCalories !== null) {
    if (nutrition?.caloriesPerServing === null || nutrition?.caloriesPerServing === undefined) {
      components.push(0.5);
    } else {
      components.push(nutrition.caloriesPerServing <= maxCalories
        ? 1
        : clamp(maxCalories / Math.max(nutrition.caloriesPerServing, 1)));
    }
  }
  if (minProtein !== null) {
    if (nutrition?.proteinGrams === null || nutrition?.proteinGrams === undefined) {
      components.push(0.5);
    } else {
      components.push(nutrition.proteinGrams >= minProtein
        ? 1
        : clamp(nutrition.proteinGrams / Math.max(minProtein, 1)));
    }
  }
  return components.length ? components.reduce((sum, value) => sum + value, 0) / components.length : 0.5;
};

const preferenceFit = (candidate: RecommendationCandidate, context: RecommendationContext): number => {
  const diet = context.preferences.diet;
  const tags = new Set([
    ...candidate.dietaryTags.map(normalizeText),
    ...((candidate.cuisineTags ?? []).map(normalizeText)),
    normalizeText(candidate.categoryName),
    normalizeText(candidate.mealName),
  ]);
  tags.delete('');
  const signals: number[] = [];

  if (diet) {
    const protein = candidate.nutrition?.proteinGrams ?? null;
    const highProteinMatch = diet === 'high-protein' &&
      (tags.has('high-protein') || (protein !== null && protein >= 30));
    const dietMatch = highProteinMatch || tags.has(diet) ||
      (diet === 'vegetarian' && tags.has('vegan'));
    signals.push(dietMatch ? 1 : 0.2);
  }

  if (context.preferences.preferredCuisines.size) {
    const cuisineMatch = [...context.preferences.preferredCuisines].some((cuisine) => tags.has(cuisine));
    signals.push(cuisineMatch ? 1 : 0.25);
  }

  const hasDislikedIngredient = ingredientNames(candidate).some((ingredient) =>
    [...context.preferences.dislikedIngredients].some((dislike) => matches(ingredient, dislike)),
  );
  if (hasDislikedIngredient && !context.preferences.strictDislikes) signals.push(0.1);

  return signals.length ? signals.reduce((sum, value) => sum + value, 0) / signals.length : 0.5;
};

const hardExclusion = (
  candidate: RecommendationCandidate,
  context: RecommendationContext,
  options: RecommendationScoreOptions,
): string | null => {
  if (candidate.status !== 'published') return 'Excluded because this recipe is not published.';
  if (options.excludeOwnRecipe !== false && candidate.authorId === context.userId) {
    return 'Excluded because it is your own recipe.';
  }
  if (candidate.allergenTags.some((allergen) => context.preferences.avoidedAllergens.has(normalizeText(allergen)))) {
    return 'Excluded because it contains an avoided allergen.';
  }
  if (context.preferences.strictDislikes && ingredientNames(candidate).some((ingredient) =>
    [...context.preferences.dislikedIngredients].some((dislike) => matches(ingredient, dislike)))) {
    return 'Excluded because it contains a strictly disliked ingredient.';
  }
  return null;
};

const emptyBreakdown = (): RecommendationBreakdown => ({
  preference: 0,
  pantryCoverage: 0,
  historicalAffinity: 0,
  nutritionFit: 0,
  timeFit: 0,
  quality: 0,
  novelty: 0,
  wasteReduction: 0,
});

@Injectable()
export class RecommendationScorer {
  score(
    candidate: RecommendationCandidate,
    context: RecommendationContext,
    options: RecommendationScoreOptions = {},
  ): RecommendationScore {
    const exclusion = hardExclusion(candidate, context, options);
    if (exclusion) {
      return { excluded: true, score: 0, reasons: [exclusion], breakdown: emptyBreakdown() };
    }

    const asOf = context.asOf ?? new Date();
    const pantryMatches = matchedPantryItems(candidate, context.pantry, asOf);
    const expiringItems = expiringPantryItems(context.pantry, asOf);
    const matchedExpiringItems = ingredientMatches(candidate, expiringItems);
    const names = ingredientNames(candidate);
    const breakdown: RecommendationBreakdown = {
      preference: clamp(preferenceFit(candidate, context)),
      pantryCoverage: names.length ? clamp(pantryMatches.length / names.length) : 0,
      historicalAffinity: clamp(
        (candidate.categoryId !== null && context.likedCategoryIds.has(candidate.categoryId) ? 0.7 : 0) +
        (candidate.mealId !== null && context.likedMealIds.has(candidate.mealId) ? 0.3 : 0),
      ),
      nutritionFit: clamp(nutritionFit(
        candidate.nutrition,
        context.preferences.maxCaloriesPerServing,
        context.preferences.minProteinGrams,
      )),
      timeFit: context.preferences.maxWeekdayCookMinutes === null || candidate.totalTimeMinutes === null
        ? 0.5
        : clamp(candidate.totalTimeMinutes <= context.preferences.maxWeekdayCookMinutes
          ? 1
          : context.preferences.maxWeekdayCookMinutes / Math.max(candidate.totalTimeMinutes, 1)),
      quality: clamp(candidate.averageRating / 5),
      novelty: context.recentlyCookedRecipeIds.has(candidate.recipeId)
        ? Math.max(0.1, 1 - Math.min(context.repeatCookCounts.get(candidate.recipeId) ?? 1, 3) * 0.25)
        : 1,
      wasteReduction: expiringItems.length
        ? clamp(matchedExpiringItems.length / expiringItems.length)
        : 0,
    };

    const score = clamp(
      breakdown.preference * WEIGHTS.preference +
      breakdown.pantryCoverage * WEIGHTS.pantryCoverage +
      breakdown.historicalAffinity * WEIGHTS.historicalAffinity +
      breakdown.nutritionFit * WEIGHTS.nutritionFit +
      breakdown.timeFit * WEIGHTS.timeFit +
      breakdown.quality * WEIGHTS.quality +
      breakdown.novelty * WEIGHTS.novelty +
      breakdown.wasteReduction * WEIGHTS.wasteReduction,
    );

    const reasons: string[] = [];
    if (pantryMatches.length) reasons.push(`Uses ${pantryMatches.length} ingredient${pantryMatches.length === 1 ? '' : 's'} from your pantry.`);
    if (matchedExpiringItems.length) reasons.push(`Uses ${matchedExpiringItems.length} ingredient${matchedExpiringItems.length === 1 ? '' : 's'} that expire soon.`);
    if (context.preferences.diet === 'high-protein' && breakdown.preference >= 0.8) {
      reasons.push('Matches your high-protein preference.');
    } else if (breakdown.preference >= 0.8 && (context.preferences.diet || context.preferences.preferredCuisines.size)) {
      reasons.push('Matches your food preferences.');
    }
    if (breakdown.historicalAffinity > 0) reasons.push('Similar to meals you rated highly.');
    if (context.preferences.maxWeekdayCookMinutes !== null && breakdown.timeFit >= 1) {
      reasons.push(`Fits your ${context.preferences.maxWeekdayCookMinutes}-minute weekday cooking limit.`);
    }
    if (breakdown.nutritionFit >= 0.9 && (context.preferences.maxCaloriesPerServing !== null || context.preferences.minProteinGrams !== null)) {
      reasons.push('Fits your nutrition preferences.');
    }
    if (candidate.averageRating >= 4) reasons.push('Highly rated by the community.');
    if (!reasons.length) reasons.push('Matches your recipe discovery preferences.');

    return {
      excluded: false,
      score,
      reasons: [...new Set(reasons)].slice(0, 3),
      breakdown,
    };
  }
}

export type { RecommendationCandidate } from './recommendation-candidates.repository';
