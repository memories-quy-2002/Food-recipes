import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StartCookingSessionDto {
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
}
