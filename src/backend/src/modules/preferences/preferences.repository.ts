import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type FoodPreferencesRecord = {
  diet: string | null;
  avoidedAllergens: string[];
  dislikedIngredients: string[];
  preferredCuisines: string[];
  cookingSkill: string | null;
  maxWeekdayCookMinutes: number | null;
  defaultServings: number | null;
  maxCaloriesPerServing: number | null;
  minProteinGrams: number | null;
  strictDislikes: boolean | null;
};

export type ReplaceFoodPreferences = {
  diet: string | null;
  avoidedAllergens: string[];
  dislikedIngredients: string[];
  preferredCuisines: string[];
  cookingSkill: string | null;
  maxWeekdayCookMinutes: number | null;
  defaultServings: number;
  maxCaloriesPerServing: number | null;
  minProteinGrams: number | null;
  strictDislikes: boolean;
};

export interface PreferencesRepositoryPort {
  findByUserId(userId: number): Promise<FoodPreferencesRecord>;
  replace(userId: number, preferences: ReplaceFoodPreferences): Promise<FoodPreferencesRecord>;
}

export const PREFERENCES_REPOSITORY = Symbol('PREFERENCES_REPOSITORY');

@Injectable()
export class PreferencesRepository implements PreferencesRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<FoodPreferencesRecord> {
    const [preference, avoidedAllergens, dislikedIngredients, preferredCuisines] = await Promise.all([
      this.prisma.userFoodPreference.findUnique({ where: { userId } }),
      this.prisma.userAvoidedAllergen.findMany({
        where: { userId },
        orderBy: { allergen: 'asc' },
      }),
      this.prisma.userDislikedIngredient.findMany({
        where: { userId },
        orderBy: { ingredientName: 'asc' },
      }),
      this.prisma.userCuisinePreference.findMany({
        where: { userId },
        orderBy: { cuisine: 'asc' },
      }),
    ]);

    return {
      diet: preference?.diet ?? null,
      avoidedAllergens: avoidedAllergens.map((item) => item.allergen),
      dislikedIngredients: dislikedIngredients.map((item) => item.ingredientName),
      preferredCuisines: preferredCuisines.map((item) => item.cuisine),
      cookingSkill: preference?.cookingSkill ?? null,
      maxWeekdayCookMinutes: preference?.maxWeekdayCookMinutes ?? null,
      defaultServings: preference?.defaultServings ?? null,
      maxCaloriesPerServing: preference?.maxCaloriesPerServing ?? null,
      minProteinGrams: preference?.minProteinGrams ?? null,
      strictDislikes: preference?.strictDislikes ?? null,
    };
  }

  async replace(userId: number, preferences: ReplaceFoodPreferences): Promise<FoodPreferencesRecord> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userFoodPreference.upsert({
        where: { userId },
        create: {
          userId,
          diet: preferences.diet,
          cookingSkill: preferences.cookingSkill,
          maxWeekdayCookMinutes: preferences.maxWeekdayCookMinutes,
          defaultServings: preferences.defaultServings,
          maxCaloriesPerServing: preferences.maxCaloriesPerServing,
          minProteinGrams: preferences.minProteinGrams,
          strictDislikes: preferences.strictDislikes,
        },
        update: {
          diet: preferences.diet,
          cookingSkill: preferences.cookingSkill,
          maxWeekdayCookMinutes: preferences.maxWeekdayCookMinutes,
          defaultServings: preferences.defaultServings,
          maxCaloriesPerServing: preferences.maxCaloriesPerServing,
          minProteinGrams: preferences.minProteinGrams,
          strictDislikes: preferences.strictDislikes,
          updatedAt: new Date(),
        },
      });

      await tx.userAvoidedAllergen.deleteMany({ where: { userId } });
      if (preferences.avoidedAllergens.length > 0) {
        await tx.userAvoidedAllergen.createMany({
          data: preferences.avoidedAllergens.map((allergen) => ({ userId, allergen })),
        });
      }

      await tx.userDislikedIngredient.deleteMany({ where: { userId } });
      if (preferences.dislikedIngredients.length > 0) {
        await tx.userDislikedIngredient.createMany({
          data: preferences.dislikedIngredients.map((ingredientName) => ({ userId, ingredientName })),
        });
      }

      await tx.userCuisinePreference.deleteMany({ where: { userId } });
      if (preferences.preferredCuisines.length > 0) {
        await tx.userCuisinePreference.createMany({
          data: preferences.preferredCuisines.map((cuisine) => ({ userId, cuisine })),
        });
      }
    });

    return this.findByUserId(userId);
  }
}
