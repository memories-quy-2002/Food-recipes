import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export const MAX_REVIEW_LENGTH = 2000;

export class UpsertRatingDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ example: 'Delicious and easy to make.', maxLength: MAX_REVIEW_LENGTH })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(MAX_REVIEW_LENGTH)
  review?: string;
}
