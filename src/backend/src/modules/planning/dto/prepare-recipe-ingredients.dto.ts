import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PrepareRecipeIngredientsDto {
  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  servings?: number;
}
