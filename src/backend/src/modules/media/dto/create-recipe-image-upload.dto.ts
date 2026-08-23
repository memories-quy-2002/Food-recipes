import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const RECIPE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const RECIPE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export class CreateRecipeImageUploadDto {
  @ApiProperty({ example: 'pasta-carbonara.webp', maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  filename!: string;

  @ApiProperty({ enum: RECIPE_IMAGE_MIME_TYPES, example: 'image/webp' })
  @IsIn(RECIPE_IMAGE_MIME_TYPES)
  contentType!: (typeof RECIPE_IMAGE_MIME_TYPES)[number];

  @ApiProperty({ example: 245760, maximum: RECIPE_IMAGE_MAX_BYTES })
  @IsInt()
  @Min(1)
  @Max(RECIPE_IMAGE_MAX_BYTES)
  size!: number;
}
