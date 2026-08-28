import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PantryUnit } from '../pantry-inventory';
import { PANTRY_STORAGE_LOCATIONS } from '../pantry-storage';

export class UpdatePantryItemDto {
  @ApiPropertyOptional({ example: 'Free-range eggs', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  have?: boolean;

  @ApiPropertyOptional({ example: 2.5, minimum: 0, maximum: 1000000, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1000000)
  quantity?: number | null;

  @ApiPropertyOptional({ example: 'KILOGRAM', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: PantryUnit | string | null;

  @ApiPropertyOptional({ example: '2026-08-28', format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-08-28', format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  openedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-08-31', format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({ enum: PANTRY_STORAGE_LOCATIONS, example: 'fridge', nullable: true })
  @IsOptional()
  @IsIn(PANTRY_STORAGE_LOCATIONS)
  storageLocation?: string | null;
}
