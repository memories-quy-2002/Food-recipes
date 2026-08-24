import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const INGREDIENT_UNITS = [
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
  'TEASPOON',
  'TABLESPOON',
  'CUP',
  'PIECE',
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export class StructuredIngredientDto {
  @ApiProperty({ example: 'chicken breast', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 500, minimum: 0, maximum: 1000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  quantity?: number;

  @ApiPropertyOptional({ enum: INGREDIENT_UNITS, example: 'GRAM' })
  @IsOptional()
  @IsEnum(INGREDIENT_UNITS)
  unit?: IngredientUnit;

  @ApiPropertyOptional({ example: 'diced', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
