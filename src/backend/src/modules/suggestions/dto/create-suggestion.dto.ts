import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const SUGGESTION_INTENTS = [
  'ingredient_match',
  'personalized',
  'meal_plan',
  'substitution',
] as const;
export type SuggestionIntent = (typeof SUGGESTION_INTENTS)[number];

export class CreateSuggestionDto {
  @ApiProperty({ enum: SUGGESTION_INTENTS, example: 'ingredient_match' })
  @IsIn(SUGGESTION_INTENTS)
  intent!: SuggestionIntent;

  @ApiPropertyOptional({ type: [String], example: ['chicken', 'onion'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  ingredients?: string[];

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  recipeId?: number;

  @ApiPropertyOptional({ example: 'milk' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ingredient?: string;
}
