import { Inject, Injectable } from '@nestjs/common';
import { UpdateFoodPreferencesDto } from './dto/update-food-preferences.dto';
import {
  FoodPreferencesRecord,
  PREFERENCES_REPOSITORY,
  PreferencesRepositoryPort,
  ReplaceFoodPreferences,
} from './preferences.repository';

export type FoodPreferences = ReplaceFoodPreferences;

@Injectable()
export class PreferencesService {
  constructor(
    @Inject(PREFERENCES_REPOSITORY)
    private readonly repository: PreferencesRepositoryPort,
  ) {}

  async get(userId: number): Promise<FoodPreferences> {
    return this.toResponse(await this.repository.findByUserId(userId));
  }

  async replace(userId: number, dto: UpdateFoodPreferencesDto): Promise<FoodPreferences> {
    const preferences: ReplaceFoodPreferences = {
      diet: this.normalizeNullableString(dto.diet),
      avoidedAllergens: this.normalizeList(dto.avoidedAllergens),
      dislikedIngredients: this.normalizeList(dto.dislikedIngredients),
      preferredCuisines: this.normalizeList(dto.preferredCuisines),
      cookingSkill: this.normalizeNullableString(dto.cookingSkill),
      maxWeekdayCookMinutes: dto.maxWeekdayCookMinutes ?? null,
      defaultServings: dto.defaultServings ?? 2,
      maxCaloriesPerServing: dto.maxCaloriesPerServing ?? null,
      minProteinGrams: dto.minProteinGrams ?? null,
      strictDislikes: dto.strictDislikes ?? false,
    };

    return this.toResponse(await this.repository.replace(userId, preferences));
  }

  private toResponse(record: FoodPreferencesRecord): FoodPreferences {
    return {
      diet: record.diet,
      avoidedAllergens: record.avoidedAllergens,
      dislikedIngredients: record.dislikedIngredients,
      preferredCuisines: record.preferredCuisines,
      cookingSkill: record.cookingSkill,
      maxWeekdayCookMinutes: record.maxWeekdayCookMinutes,
      defaultServings: record.defaultServings ?? 2,
      maxCaloriesPerServing: record.maxCaloriesPerServing,
      minProteinGrams: record.minProteinGrams,
      strictDislikes: record.strictDislikes ?? false,
    };
  }

  private normalizeList(values: string[] | undefined): string[] {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  }

  private normalizeNullableString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }
}

export type PreferencesServicePort = Pick<PreferencesService, 'get' | 'replace'>;
