import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAX_REVIEW_LENGTH = 2000;

export class UpsertRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REVIEW_LENGTH)
  review?: string;
}
