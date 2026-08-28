import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';
import { MEAL_PLAN_SLOTS, MealPlanSlot } from './add-meal-plan-item.dto';

export class MealPlanSlotRequestDto {
  @ApiProperty({ example: '2026-08-24', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  date!: string;

  @ApiProperty({ enum: MEAL_PLAN_SLOTS, example: 'dinner' })
  @IsIn(MEAL_PLAN_SLOTS)
  slot!: MealPlanSlot;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 24, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  servings?: number;
}

export class LockedMealPlanItemDto extends MealPlanSlotRequestDto {
  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recipeId!: number;
}

export class GenerateMealPlanDto {
  @ApiProperty({ example: 'My weeknight meals', maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: '2026-08-24', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  from!: string;

  @ApiProperty({ example: '2026-08-30', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  to!: string;

  @ApiProperty({ example: 7, minimum: 1, maximum: 31 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  targetMeals!: number;

  @ApiPropertyOptional({ type: [MealPlanSlotRequestDto], maxItems: 31 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @ValidateNested({ each: true })
  @Type(() => MealPlanSlotRequestDto)
  slots?: MealPlanSlotRequestDto[];

  @ApiPropertyOptional({ type: [LockedMealPlanItemDto], maxItems: 31 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @ValidateNested({ each: true })
  @Type(() => LockedMealPlanItemDto)
  lockedItems?: LockedMealPlanItemDto[];

  @ApiPropertyOptional({ type: [Number], maxItems: 31 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @IsInt({ each: true })
  @Min(1, { each: true })
  excludedRecipeIds?: number[];
}

export class MealPlanPreviewItemDto extends LockedMealPlanItemDto {
  @ApiProperty({ example: false })
  locked!: boolean;
}

export class FromMealPlanPreviewDto {
  @ApiProperty({ example: 'opaque-preview-token' })
  @IsString()
  @MinLength(32)
  previewToken!: string;

  @ApiPropertyOptional({ example: 'My saved week', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  // The server intentionally ignores client-supplied recipe IDs and uses the token payload.
  @ApiPropertyOptional({ type: [MealPlanPreviewItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanPreviewItemDto)
  items?: MealPlanPreviewItemDto[];
}
