import { IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export const MAX_REVIEW_LENGTH = 2000;

export class UpsertRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(MAX_REVIEW_LENGTH)
  review?: string;
}
