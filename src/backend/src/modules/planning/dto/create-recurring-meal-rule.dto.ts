import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { MEAL_PLAN_SLOTS, MealPlanSlot } from './add-meal-plan-item.dto';

export class CreateRecurringMealRuleDto {
  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: 'ISO weekday: Monday=0, Sunday=6' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ enum: MEAL_PLAN_SLOTS, example: 'dinner' })
  @IsIn(MEAL_PLAN_SLOTS)
  slot!: MealPlanSlot;

  @ApiProperty({ example: 11, minimum: 1 })
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 24 })
  @IsInt()
  @Min(1)
  @Max(24)
  servings!: number;
}
