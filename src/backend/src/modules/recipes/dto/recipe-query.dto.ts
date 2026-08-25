import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const RECIPE_SORTS = ['popular', 'rating', 'newest', 'quickest', 'name'] as const;
export type RecipeSort = (typeof RECIPE_SORTS)[number];
export const RECIPE_FILTERS = [
  'quick',
  'vegetarian',
  'high-protein',
  'under-30',
  'one-pan',
  'beginner',
] as const;
export type RecipeFilter = (typeof RECIPE_FILTERS)[number];
export const DEFAULT_RECIPE_PAGE = 1;
export const DEFAULT_RECIPE_LIMIT = 20;
export const MAX_RECIPE_PAGE = 1_000_000;
export const MAX_RECIPE_LIMIT = 100;

export class RecipeQueryDto {
  @ApiPropertyOptional({ description: 'Search by recipe name or description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Backward-compatible alias for q',
    writeOnly: true,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mealId?: number;

  @ApiPropertyOptional({ enum: RECIPE_SORTS, default: 'popular' })
  @IsOptional()
  @IsIn(RECIPE_SORTS)
  sort?: RecipeSort;

  @ApiPropertyOptional({ enum: RECIPE_FILTERS })
  @IsOptional()
  @IsIn(RECIPE_FILTERS)
  filter?: RecipeFilter;

  @ApiPropertyOptional({ default: DEFAULT_RECIPE_PAGE, minimum: 1, maximum: MAX_RECIPE_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECIPE_PAGE)
  page?: number;

  @ApiPropertyOptional({
    default: DEFAULT_RECIPE_LIMIT,
    minimum: 1,
    maximum: MAX_RECIPE_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECIPE_LIMIT)
  limit?: number;
}
