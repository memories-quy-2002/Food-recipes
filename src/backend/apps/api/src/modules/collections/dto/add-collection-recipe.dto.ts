import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddCollectionRecipeDto {
  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  recipeId!: number;
}
