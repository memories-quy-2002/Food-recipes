import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MAX_DISLIKED_INGREDIENTS = 32;
export const MAX_PREFERRED_CUISINES = 16;

export class UpdateFoodPreferencesDto {
  @ApiPropertyOptional({ example: 'high-protein', nullable: true, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  diet?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['peanuts'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  avoidedAllergens?: string[];

  @ApiPropertyOptional({ type: [String], example: ['cilantro'], maxItems: MAX_DISLIKED_INGREDIENTS })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DISLIKED_INGREDIENTS)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  dislikedIngredients?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Vietnamese', 'Japanese'], maxItems: MAX_PREFERRED_CUISINES })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PREFERRED_CUISINES)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  preferredCuisines?: string[];

  @ApiPropertyOptional({ example: 'intermediate', nullable: true, maxLength: 16 })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  cookingSkill?: string | null;

  @ApiPropertyOptional({ example: 30, minimum: 10, maximum: 240, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(240)
  maxWeekdayCookMinutes?: number | null;

  @ApiPropertyOptional({ example: 2, default: 2, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  defaultServings?: number;

  @ApiPropertyOptional({ example: 650, minimum: 100, maximum: 5000, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(5000)
  maxCaloriesPerServing?: number | null;

  @ApiPropertyOptional({ example: 30, minimum: 0, maximum: 300, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(300)
  minProteinGrams?: number | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  strictDislikes?: boolean;
}
