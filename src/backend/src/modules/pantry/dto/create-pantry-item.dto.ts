import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PANTRY_UNITS, PantryUnit } from '../pantry-inventory';

export class CreatePantryItemDto {
  @ApiProperty({ example: 'Eggs', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  have?: boolean;

  @ApiPropertyOptional({ example: 2.5, minimum: 0, maximum: 1000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1000000)
  quantity?: number | null;

  @ApiPropertyOptional({ enum: PANTRY_UNITS, example: 'KILOGRAM' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: PantryUnit | string | null;
}
