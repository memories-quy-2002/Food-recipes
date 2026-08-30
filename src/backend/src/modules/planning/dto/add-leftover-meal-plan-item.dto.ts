import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsIn, Matches, Max, Min } from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';
import { MEAL_PLAN_SLOTS, MealPlanSlot } from './add-meal-plan-item.dto';
export class AddLeftoverMealPlanItemDto {
  @ApiProperty({ example: 8 }) @IsInt() @Min(1) leftoverBatchId!: number;
  @ApiProperty({ example: '2026-08-31', pattern: 'YYYY-MM-DD' }) @IsDateString() @Matches(ISO_DATE_PATTERN) date!: string;
  @ApiProperty({ enum: MEAL_PLAN_SLOTS }) @IsIn(MEAL_PLAN_SLOTS) slot!: MealPlanSlot;
  @ApiProperty({ example: 2, minimum: 1, maximum: 24 }) @IsInt() @Min(1) @Max(24) servings!: number;
}
