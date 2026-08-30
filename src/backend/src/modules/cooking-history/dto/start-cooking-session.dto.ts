import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
export const COOKING_SOURCE_TYPES = ['recipe', 'leftover'] as const;
export type CookingSourceType = (typeof COOKING_SOURCE_TYPES)[number];

export class StartCookingSessionDto {
  @ApiPropertyOptional({ enum: COOKING_SOURCE_TYPES, default: 'recipe' }) @IsOptional() @IsIn(COOKING_SOURCE_TYPES) sourceType?: CookingSourceType;
  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(1)
  mealPlanItemId?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  servings?: number;
  @ApiPropertyOptional({ example: 8 }) @IsOptional() @IsInt() @Min(1) leftoverBatchId?: number;
  @ApiPropertyOptional({ example: 12 }) @IsOptional() @IsInt() @Min(1) householdId?: number;
}
