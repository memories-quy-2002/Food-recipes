import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateCookingHistoryDto {
  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(1)
  mealPlanItemId?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 24, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  servings?: number;

  @ApiPropertyOptional({ example: '2026-08-25T17:00:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-25T17:35:00.000Z', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
