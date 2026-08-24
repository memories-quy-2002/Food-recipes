import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { StructuredIngredientDto } from './structured-ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({ example: 'Pasta Carbonara' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  mealId!: number;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty({ example: 10, description: 'Preparation time in minutes' })
  @IsInt()
  @Min(1)
  prepTimeMinutes!: number;

  @ApiProperty({ example: 20, description: 'Cooking time in minutes' })
  @IsInt()
  @Min(1)
  cookTimeMinutes!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @ApiPropertyOptional({ type: [StructuredIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StructuredIngredientDto)
  structuredIngredients?: StructuredIngredientDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instructions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
