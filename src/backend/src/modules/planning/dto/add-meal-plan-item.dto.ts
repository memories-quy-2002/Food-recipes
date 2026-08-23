import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, Matches, Max, Min } from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';

export const MEAL_PLAN_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealPlanSlot = (typeof MEAL_PLAN_SLOTS)[number];

export class AddMealPlanItemDto {
  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiProperty({ example: '2026-08-25', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  date!: string;

  @ApiProperty({ enum: MEAL_PLAN_SLOTS, example: 'dinner' })
  @IsIn(MEAL_PLAN_SLOTS)
  slot!: MealPlanSlot;

  @ApiProperty({ example: 4, minimum: 1, maximum: 24 })
  @IsInt()
  @Min(1)
  @Max(24)
  servings!: number;
}
