import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AddShoppingListItemDto {
  @ApiProperty({ example: 'Tomatoes', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @ApiPropertyOptional({ example: '500 g', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  quantity?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sourceRecipeId?: number;
}
