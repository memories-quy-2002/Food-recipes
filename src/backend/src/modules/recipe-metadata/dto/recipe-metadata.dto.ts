import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const RECIPE_METADATA_SOURCES = [
  'provided_by_author',
  'estimated',
  'verified_external',
] as const;
export type RecipeMetadataSource = (typeof RECIPE_METADATA_SOURCES)[number];

export const RECIPE_ALLERGENS = [
  'milk',
  'eggs',
  'peanuts',
  'tree_nuts',
  'soy',
  'wheat',
  'fish',
  'shellfish',
  'sesame',
] as const;
export type RecipeAllergenName = (typeof RECIPE_ALLERGENS)[number];

export class RecipeNutritionInputDto {
  @ApiProperty({ example: 420, description: 'Calories per serving' })
  @IsInt()
  @Min(0)
  @Max(100000)
  caloriesPerServing!: number;

  @ApiPropertyOptional({ example: 28, description: 'Protein grams per serving' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  proteinGrams?: number;

  @ApiPropertyOptional({ example: 45, description: 'Carbohydrate grams per serving' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  carbohydratesGrams?: number;

  @ApiPropertyOptional({ example: 12, description: 'Fat grams per serving' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  fatGrams?: number;

  @ApiPropertyOptional({ example: 6, description: 'Fiber grams per serving' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  fiberGrams?: number;

  @ApiPropertyOptional({ example: 8, description: 'Sugar grams per serving' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  sugarGrams?: number;

  @ApiPropertyOptional({ example: 540, description: 'Sodium milligrams per serving' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  sodiumMilligrams?: number;

  @ApiProperty({ enum: RECIPE_METADATA_SOURCES, example: 'provided_by_author' })
  @IsIn(RECIPE_METADATA_SOURCES)
  source!: RecipeMetadataSource;

  @ApiPropertyOptional({ example: 'Recipe card' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceReference?: string;
}

export class RecipeAllergenInputDto {
  @ApiProperty({ enum: RECIPE_ALLERGENS, example: 'peanuts' })
  @IsIn(RECIPE_ALLERGENS)
  name!: RecipeAllergenName;

  @ApiProperty({ enum: RECIPE_METADATA_SOURCES, example: 'provided_by_author' })
  @IsIn(RECIPE_METADATA_SOURCES)
  source!: RecipeMetadataSource;

  @ApiPropertyOptional({ example: 'Ingredient label checked' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceReference?: string;
}

export class UpsertRecipeMetadataDto {
  @ApiPropertyOptional({ type: RecipeNutritionInputDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipeNutritionInputDto)
  nutrition?: RecipeNutritionInputDto | null;

  @ApiPropertyOptional({ type: [RecipeAllergenInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeAllergenInputDto)
  allergens?: RecipeAllergenInputDto[];
}
