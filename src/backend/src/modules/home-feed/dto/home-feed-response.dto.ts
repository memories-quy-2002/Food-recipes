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

  @ApiProperty({ required: false })
  pantry_match_count?: number;

  @ApiProperty({ required: false })
  recommendation_score?: number;

  @ApiProperty({ type: [String], required: false })
  reasons?: string[];
}

export class HomeFeedActiveSessionDto {
  @ApiProperty()
  session_id!: number;

  @ApiProperty()
  recipe_id!: number;

  @ApiProperty()
  recipe_name!: string;

  @ApiProperty({ nullable: true })
  meal_plan_item_id!: number | null;

  @ApiProperty({ nullable: true })
  planned_date!: Date | string | null;

  @ApiProperty({ nullable: true })
  slot!: string | null;

  @ApiProperty()
  servings!: number;

  @ApiProperty()
  current_step!: number;

  @ApiProperty()
  total_steps!: number;

  @ApiProperty({ enum: ['active', 'paused'] })
  status!: 'active' | 'paused';

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;
}

export class HomeFeedNextMealDto {
  @ApiProperty()
  item_id!: number;

  @ApiProperty()
  plan_id!: number;

  @ApiProperty()
  recipe_id!: number;

  @ApiProperty()
  recipe_name!: string;

  @ApiProperty({ type: String, format: 'date' })
  planned_date!: Date | string;

  @ApiProperty()
  slot!: string;

  @ApiProperty()
  servings!: number;
}

export class HomeFeedSectionContextDto {
  @ApiProperty({ type: () => HomeFeedActiveSessionDto, nullable: true, required: false })
  active_session?: HomeFeedActiveSessionDto | null;

  @ApiProperty({ type: () => HomeFeedNextMealDto, nullable: true, required: false })
  next_meal?: HomeFeedNextMealDto | null;
}

export class HomeFeedSectionDto {
  @ApiProperty({ enum: ['continue', 'use_soon', 'recommended', 'planned', 'saved', 'popular', 'quick'] })
  key!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [HomeFeedRecipeDto] })
  recipes!: HomeFeedRecipeDto[];

  @ApiProperty({ type: HomeFeedSectionContextDto, required: false })
  context?: HomeFeedSectionContextDto;
}

export class HomeFeedKitchenStateDto {
  @ApiProperty({ type: HomeFeedActiveSessionDto, nullable: true })
  active_session!: HomeFeedActiveSessionDto | null;

  @ApiProperty({ type: HomeFeedNextMealDto, nullable: true })
  next_meal!: HomeFeedNextMealDto | null;

  @ApiProperty()
  shopping!: { open_items: number; completed_items: number };

  @ApiProperty()
  pantry!: { available_items: number };

  @ApiProperty()
  progress!: { saved_recipes: number; planned_meals: number; completed_cooks: number };
}

export class HomeFeedResponseDto {
  @ApiProperty()
  personalized!: boolean;

  @ApiProperty({ type: [HomeFeedSectionDto] })
  sections!: HomeFeedSectionDto[];

  @ApiProperty({ type: HomeFeedKitchenStateDto, required: false })
  kitchen?: HomeFeedKitchenStateDto;
}
