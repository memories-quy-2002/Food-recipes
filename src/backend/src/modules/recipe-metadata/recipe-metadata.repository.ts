import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  RecipeAllergenInputDto,
  RecipeNutritionInputDto,
} from './dto/recipe-metadata.dto';

export type RecipeNutritionRecord = {
  recipe_id: number;
  calories_per_serving: number;
  protein_grams: number | null;
  carbohydrates_grams: number | null;
  fat_grams: number | null;
  fiber_grams: number | null;
  sugar_grams: number | null;
  sodium_milligrams: number | null;
  source: string;
  source_reference: string | null;
  updated_at: Date;
};

export type RecipeAllergenRecord = {
  allergen_id: number;
  recipe_id: number;
  name: string;
  source: string;
  source_reference: string | null;
  updated_at: Date;
};

export type RecipeMetadataRecord = {
  nutrition: RecipeNutritionRecord | null;
  allergens: RecipeAllergenRecord[];
};

export interface RecipeMetadataRepositoryPort {
  recipeOwnerId(recipeId: number): Promise<number | null>;
  findByRecipeId(recipeId: number): Promise<RecipeMetadataRecord>;
  replace(
    recipeId: number,
    nutrition: RecipeNutritionInputDto | null,
    allergens: RecipeAllergenInputDto[],
  ): Promise<RecipeMetadataRecord>;
}

export const RECIPE_METADATA_REPOSITORY = Symbol('RECIPE_METADATA_REPOSITORY');

const normalizeNutrition = (row: RecipeNutritionRecord): RecipeNutritionRecord => ({
  ...row,
  recipe_id: Number(row.recipe_id),
  calories_per_serving: Number(row.calories_per_serving),
  protein_grams: row.protein_grams === null ? null : Number(row.protein_grams),
  carbohydrates_grams: row.carbohydrates_grams === null ? null : Number(row.carbohydrates_grams),
  fat_grams: row.fat_grams === null ? null : Number(row.fat_grams),
  fiber_grams: row.fiber_grams === null ? null : Number(row.fiber_grams),
  sugar_grams: row.sugar_grams === null ? null : Number(row.sugar_grams),
  sodium_milligrams: row.sodium_milligrams === null ? null : Number(row.sodium_milligrams),
});

const normalizeAllergen = (row: RecipeAllergenRecord): RecipeAllergenRecord => ({
  ...row,
  allergen_id: Number(row.allergen_id),
  recipe_id: Number(row.recipe_id),
});

@Injectable()
export class RecipeMetadataRepository implements RecipeMetadataRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async recipeOwnerId(recipeId: number): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
      SELECT user_id FROM recipes WHERE recipe_id = ${recipeId}
    `);
    return rows[0] ? Number(rows[0].user_id) : null;
  }

  async findByRecipeId(recipeId: number): Promise<RecipeMetadataRecord> {
    const [nutritionRows, allergenRows] = await Promise.all([
      this.prisma.$queryRaw<RecipeNutritionRecord[]>(Prisma.sql`
        SELECT recipe_id, calories_per_serving, protein_grams, carbohydrates_grams,
          fat_grams, fiber_grams, sugar_grams, sodium_milligrams, source,
          source_reference, updated_at
        FROM recipe_nutrition
        WHERE recipe_id = ${recipeId}
      `),
      this.prisma.$queryRaw<RecipeAllergenRecord[]>(Prisma.sql`
        SELECT allergen_id, recipe_id, name, source, source_reference, updated_at
        FROM recipe_allergens
        WHERE recipe_id = ${recipeId}
        ORDER BY name ASC, allergen_id ASC
      `),
    ]);

    return {
      nutrition: nutritionRows[0] ? normalizeNutrition(nutritionRows[0]) : null,
      allergens: (allergenRows ?? []).map(normalizeAllergen),
    };
  }

  async replace(
    recipeId: number,
    nutrition: RecipeNutritionInputDto | null,
    allergens: RecipeAllergenInputDto[],
  ): Promise<RecipeMetadataRecord> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`
        DELETE FROM recipe_nutrition WHERE recipe_id = ${recipeId}
      `);
      await transaction.$executeRaw(Prisma.sql`
        DELETE FROM recipe_allergens WHERE recipe_id = ${recipeId}
      `);

      if (nutrition) {
        await transaction.$executeRaw(Prisma.sql`
          INSERT INTO recipe_nutrition (
            recipe_id, calories_per_serving, protein_grams, carbohydrates_grams,
            fat_grams, fiber_grams, sugar_grams, sodium_milligrams, source,
            source_reference
          ) VALUES (
            ${recipeId}, ${nutrition.caloriesPerServing}, ${nutrition.proteinGrams ?? null},
            ${nutrition.carbohydratesGrams ?? null}, ${nutrition.fatGrams ?? null},
            ${nutrition.fiberGrams ?? null}, ${nutrition.sugarGrams ?? null},
            ${nutrition.sodiumMilligrams ?? null}, ${nutrition.source},
            ${nutrition.sourceReference?.trim() || null}
          )
        `);
      }

      for (const allergen of allergens) {
        await transaction.$executeRaw(Prisma.sql`
          INSERT INTO recipe_allergens (recipe_id, name, source, source_reference)
          VALUES (
            ${recipeId}, ${allergen.name}, ${allergen.source},
            ${allergen.sourceReference?.trim() || null}
          )
        `);
      }
    });

    return this.findByRecipeId(recipeId);
  }
}
