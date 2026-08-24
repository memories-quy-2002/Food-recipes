import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class AddRecipeIngredientsDto {
  @ApiPropertyOptional({ example: 15 })
  @ValidateIf((value) => !value.recipeIds?.length)
  @IsInt()
  @Min(1)
  recipeId!: number;

  @ApiPropertyOptional({ type: [Number], example: [15, 16], minItems: 1, maxItems: 20 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  @Min(1, { each: true })
  recipeIds?: number[];
}
