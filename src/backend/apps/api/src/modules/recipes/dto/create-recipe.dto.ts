import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
