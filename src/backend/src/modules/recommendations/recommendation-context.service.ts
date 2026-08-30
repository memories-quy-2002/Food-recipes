import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CookingHistoryService, CookingHistoryServicePort } from '../cooking-history/cooking-history.service';
import { PantryService, PantryServicePort } from '../pantry/pantry.service';
import { PreferencesService, PreferencesServicePort } from '../preferences/preferences.service';

export type RecommendationPantryItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  have: boolean;
  expiresAt: Date | null;
};

export type RecommendationContext = {
  userId: number;
  preferences: {
    diet: string | null;
    avoidedAllergens: ReadonlySet<string>;
    dislikedIngredients: ReadonlySet<string>;
    preferredCuisines: ReadonlySet<string>;
    strictDislikes: boolean;
    maxWeekdayCookMinutes: number | null;
    maxCaloriesPerServing: number | null;
    minProteinGrams: number | null;
  };
  pantry: RecommendationPantryItem[];
  likedCategoryIds: ReadonlySet<number>;
  likedMealIds: ReadonlySet<number>;
  recentlyCookedRecipeIds: ReadonlySet<number>;
  repeatCookCounts: ReadonlyMap<number, number>;
  savedRecipeIds: ReadonlySet<number>;
  plannedRecipeIds: ReadonlySet<number>;
  notInterestedRecipeIds: ReadonlySet<number>;
  removedFromMealPlanRecipeIds: ReadonlySet<number>;
  asOf?: Date;
};

type LikedTaxonomyRow = {
  category_id: number | bigint | null;
  meal_id: number | bigint | null;
};

type ImplicitSignalRow = { signal: string; recipe_id: number | bigint };

type PantryItemWithExpiry = {
  name: string;
  quantity: number | null;
  unit: string | null;
  have: boolean;
  expiresAt?: Date | string | null;
};

const normalizeText = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? '';

const normalizeSet = (values: readonly string[]): ReadonlySet<string> =>
  new Set(values.map(normalizeText).filter(Boolean));

const parseDate = (value: Date | string | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

@Injectable()
export class RecommendationContextService {
  constructor(
    @Inject(PreferencesService)
    private readonly preferencesService: PreferencesServicePort,
    @Inject(PantryService)
    private readonly pantryService: PantryServicePort,
    @Inject(CookingHistoryService)
    private readonly cookingHistoryService: CookingHistoryServicePort,
    private readonly prisma: PrismaService,
  ) {}

  async build(userId: number): Promise<RecommendationContext> {
    const [preferences, pantryResponse, historyResponse, likedTaxonomy, implicitSignals] = await Promise.all([
      this.preferencesService.get(userId),
      this.pantryService.list(userId),
      this.cookingHistoryService.list(userId),
      this.prisma.$queryRaw<LikedTaxonomyRow[]>(Prisma.sql`
        SELECT r.category_id, r.meal_id
        FROM rating rt
        JOIN recipes r ON r.recipe_id = rt.recipe_id
        WHERE rt.user_id = ${userId}
          AND rt.score >= 4
      `),
      this.prisma.$queryRaw<ImplicitSignalRow[]>(Prisma.sql`
        SELECT 'saved' AS signal, w.recipe_id FROM wishlist w WHERE w.user_id = ${userId}
        UNION ALL
        SELECT 'planned' AS signal, i.recipe_id
        FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id
        WHERE p.user_id = ${userId}
        UNION ALL
        SELECT 'planned' AS signal, i.recipe_id
        FROM meal_plan_items i
        JOIN meal_plans p ON p.plan_id = i.plan_id
        JOIN household_members hm ON hm.household_id = p.household_id AND hm.user_id = ${userId}
        WHERE p.household_id IS NOT NULL
        UNION ALL
        SELECT 'not_interested' AS signal, n.recipe_id
        FROM recommendation_not_interested n WHERE n.user_id = ${userId}
        UNION ALL
        SELECT 'removed_from_meal_plan' AS signal, m.recipe_id
        FROM recommendation_meal_plan_removals m
        WHERE m.user_id = ${userId}
          AND m.removed_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `),
    ]);

    const likedCategoryIds = new Set<number>();
    const likedMealIds = new Set<number>();
    for (const row of likedTaxonomy) {
      if (row.category_id !== null) likedCategoryIds.add(Number(row.category_id));
      if (row.meal_id !== null) likedMealIds.add(Number(row.meal_id));
    }

    const recentlyCookedRecipeIds = new Set<number>();
    const repeatCookCounts = new Map<number, number>();
    for (const item of historyResponse.items) {
      const recipeId = Number(item.recipe_id);
      recentlyCookedRecipeIds.add(recipeId);
      repeatCookCounts.set(recipeId, (repeatCookCounts.get(recipeId) ?? 0) + 1);
    }

    const savedRecipeIds = new Set<number>();
    const plannedRecipeIds = new Set<number>();
    const notInterestedRecipeIds = new Set<number>();
    const removedFromMealPlanRecipeIds = new Set<number>();
    for (const row of implicitSignals) {
      const recipeId = Number(row.recipe_id);
      if (row.signal === 'saved') savedRecipeIds.add(recipeId);
      if (row.signal === 'planned') plannedRecipeIds.add(recipeId);
      if (row.signal === 'not_interested') notInterestedRecipeIds.add(recipeId);
      if (row.signal === 'removed_from_meal_plan') removedFromMealPlanRecipeIds.add(recipeId);
    }

    return {
      userId,
      preferences: {
        diet: normalizeText(preferences.diet) || null,
        avoidedAllergens: normalizeSet(preferences.avoidedAllergens),
        dislikedIngredients: normalizeSet(preferences.dislikedIngredients),
        preferredCuisines: normalizeSet(preferences.preferredCuisines),
        strictDislikes: preferences.strictDislikes,
        maxWeekdayCookMinutes: preferences.maxWeekdayCookMinutes,
        maxCaloriesPerServing: preferences.maxCaloriesPerServing,
        minProteinGrams: preferences.minProteinGrams,
      },
      pantry: pantryResponse.items.map((item) => {
        const pantryItem = item as PantryItemWithExpiry;
        return {
          name: pantryItem.name,
          quantity: pantryItem.quantity,
          unit: pantryItem.unit,
          have: pantryItem.have,
          expiresAt: parseDate(pantryItem.expiresAt),
        };
      }),
      likedCategoryIds,
      likedMealIds,
      recentlyCookedRecipeIds,
      repeatCookCounts,
      savedRecipeIds,
      plannedRecipeIds,
      notInterestedRecipeIds,
      removedFromMealPlanRecipeIds,
      asOf: new Date(),
    };
  }
}

export type RecommendationContextServicePort = Pick<RecommendationContextService, 'build'>;
