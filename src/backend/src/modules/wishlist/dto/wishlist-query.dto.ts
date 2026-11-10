import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const WISHLIST_SORTS = ['recent', 'name', 'rating'] as const;
export type WishlistSort = (typeof WISHLIST_SORTS)[number];

export class WishlistQueryDto {
  @ApiPropertyOptional({ description: 'Filter saved recipes by recipe name', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: WISHLIST_SORTS, default: 'recent' })
  @IsOptional()
  @IsIn(WISHLIST_SORTS)
  sort?: WishlistSort;

  @ApiPropertyOptional({ minimum: 1, maximum: 1_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
