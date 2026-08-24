import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const MAX_RECIPE_INGREDIENTS = 100;
export const MAX_RECIPE_TAGS = 32;

export class RecipeIngredientDto {
  @ApiPropertyOptional({ example: 1.5, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity?: number | null;

  @ApiPropertyOptional({ example: '1/2' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  quantityText?: string | null;

  @ApiPropertyOptional({ example: 'cup' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  unit?: string | null;

  @ApiProperty({ example: 'Tomatoes', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'diced' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  preparation?: string | null;

  @ApiPropertyOptional({ example: '1 cup diced tomatoes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  originalText?: string | null;
}

export class ReplaceRecipeIngredientsDto {
  @ApiProperty({ type: [RecipeIngredientDto] })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPE_INGREDIENTS)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];
}

export class ReplaceRecipeNutritionDto {
  @ApiPropertyOptional({ example: 4, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  servings?: number | null;

  @ApiPropertyOptional({ example: 425, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calories?: number | null;

  @ApiPropertyOptional({ example: 18, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  protein?: number | null;

  @ApiPropertyOptional({ example: 52, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  carbohydrates?: number | null;

  @ApiPropertyOptional({ example: 12, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  fat?: number | null;

  @ApiPropertyOptional({ example: 5, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fiber?: number | null;

  @ApiPropertyOptional({ example: 8, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sugar?: number | null;

  @ApiPropertyOptional({ example: 620, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sodium?: number | null;
}

export class ReplaceRecipeTagsDto {
  @ApiPropertyOptional({ type: [String], example: ['vegetarian'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_RECIPE_TAGS)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  dietaryTags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['peanuts'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_RECIPE_TAGS)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  allergenTags?: string[];
}

export const RECIPE_STATUSES = ['draft', 'published', 'archived'] as const;
export type RecipeStatus = (typeof RECIPE_STATUSES)[number];
export const RECIPE_STATUS_FILTERS = ['all', ...RECIPE_STATUSES] as const;
export type RecipeStatusFilter = (typeof RECIPE_STATUS_FILTERS)[number];

export class RecipeStatusQueryDto {
  @ApiPropertyOptional({ enum: RECIPE_STATUS_FILTERS, default: 'all' })
  @IsOptional()
  @IsString()
  @IsIn(RECIPE_STATUS_FILTERS)
  status?: RecipeStatusFilter;
}
