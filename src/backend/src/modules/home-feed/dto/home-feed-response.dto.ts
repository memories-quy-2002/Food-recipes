import { ApiProperty } from '@nestjs/swagger';

export class HomeFeedRecipeDto {
  @ApiProperty()
  recipe_id!: number;

  @ApiProperty()
  recipe_name!: string;

  @ApiProperty({ nullable: true })
  recipe_description!: string | null;

  @ApiProperty()
  prep_time_minutes!: number;

  @ApiProperty()
  cook_time_minutes!: number;

  @ApiProperty()
  total_time_minutes!: number;

  @ApiProperty({ nullable: true })
  date_added!: Date | null;

  @ApiProperty({ nullable: true })
  image_url!: string | null;

  @ApiProperty()
  user_id!: number;

  @ApiProperty()
  meal_id!: number;

  @ApiProperty()
  meal_name!: string;

  @ApiProperty({ nullable: true })
  meal_description!: string | null;

  @ApiProperty()
  category_id!: number;

  @ApiProperty()
  category_name!: string;

  @ApiProperty()
  overall_score!: number;

  @ApiProperty()
  num_ratings!: number;

  @ApiProperty({ type: [String] })
  dietary_tags!: string[];
}

export class HomeFeedSectionDto {
  @ApiProperty({ enum: ['continue', 'pantry', 'recommended', 'saved', 'quick', 'popular'] })
  key!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [HomeFeedRecipeDto] })
  recipes!: HomeFeedRecipeDto[];
}

export class HomeFeedResponseDto {
  @ApiProperty()
  personalized!: boolean;

  @ApiProperty({ type: [HomeFeedSectionDto] })
  sections!: HomeFeedSectionDto[];
}
