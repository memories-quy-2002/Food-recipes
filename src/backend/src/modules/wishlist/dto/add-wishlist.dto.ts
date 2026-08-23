import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddWishlistDto {
  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recipeId!: number;
}
