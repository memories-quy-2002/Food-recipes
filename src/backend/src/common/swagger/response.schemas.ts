import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiProperty({ type: String, example: 'request-id', nullable: true })
  requestId!: string | null;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';
}

export class PublicUserResponseDto {
  @ApiProperty({ example: 7 })
  user_id!: number;

  @ApiProperty({ example: 'Ada Lovelace' })
  full_name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  email!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_on!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  last_login!: string | null;

  @ApiProperty({ type: String, example: '+1 555 0100', nullable: true })
  phone!: string | null;

  @ApiProperty({ type: String, example: 'London', nullable: true })
  address!: string | null;

  @ApiProperty({ enum: ['user', 'admin'], example: 'user' })
  role!: 'user' | 'admin';

  @ApiProperty({ example: false })
  email_verified!: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ type: PublicUserResponseDto })
  user!: PublicUserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token!: string;

  @ApiProperty({ example: 'Logged in!' })
  message!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Password updated successfully!' })
  message!: string;
}

export class RecipeNoteDto {
  @ApiProperty({ example: 7 })
  user_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Use half the salt next time.' })
  note!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;
}

export class NoteResponseDto {
  @ApiProperty({ type: RecipeNoteDto, nullable: true })
  note!: RecipeNoteDto | null;
}

export class PantryItemDto {
  @ApiProperty({ example: 4 })
  pantry_id!: number;

  @ApiProperty({ example: 7 })
  user_id!: number;

  @ApiProperty({ example: 'Eggs' })
  name!: string;

  @ApiProperty({ example: true })
  have!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;
}

export class PantryItemResponseDto {
  @ApiProperty({ type: PantryItemDto })
  item!: PantryItemDto;
}

export class PantryResponseDto {
  @ApiProperty({ type: [PantryItemDto] })
  items!: PantryItemDto[];
}

export class WishlistRemovalResponseDto {
  @ApiProperty({ example: 'Wishlist item removed' })
  message!: string;
}

export class RecipeResponseDto {
  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ type: String, example: 'A quick weeknight pasta.', nullable: true })
  recipe_description!: string | null;

  @ApiProperty({ example: 10 })
  prep_time_minutes!: number;

  @ApiProperty({ example: 20 })
  cook_time_minutes!: number;

  @ApiProperty({ example: 30, description: 'Preparation plus cooking time in minutes' })
  total_time_minutes!: number;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  date_added!: string | null;

  @ApiProperty({ type: String, example: 'https://example.com/pasta.jpg', nullable: true })
  image_url!: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  ingredients?: string[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  instructions?: string[] | null;

  @ApiPropertyOptional({ type: () => [RecipeStructuredIngredientDto], nullable: true })
  structured_ingredients?: RecipeStructuredIngredientDto[] | null;

  @ApiProperty({ example: 7 })
  user_id!: number;

  @ApiPropertyOptional({ type: String, example: 'Ada Lovelace', nullable: true })
  full_name?: string | null;

  @ApiPropertyOptional({ example: 1 })
  meal_id?: number;

  @ApiPropertyOptional({ example: 'Dinner' })
  meal_name?: string;

  @ApiPropertyOptional({ type: String, example: 'Dinner ideas', nullable: true })
  meal_description?: string | null;

  @ApiPropertyOptional({ example: 8 })
  category_id?: number;

  @ApiPropertyOptional({ example: 'Pasta' })
  category_name?: string;

  @ApiPropertyOptional({ example: 4.5 })
  overall_score?: number;

  @ApiPropertyOptional({ example: 12 })
  num_ratings?: number;
}

export class RecipeStructuredIngredientDto {
  @ApiProperty({ example: 1 })
  ingredient_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'chicken breast' })
  name!: string;

  @ApiProperty({ example: 500, nullable: true })
  quantity!: number | null;

  @ApiProperty({ example: 'GRAM', nullable: true })
  unit!: string | null;

  @ApiProperty({ example: 'diced', nullable: true })
  note!: string | null;

  @ApiProperty({ example: 0 })
  position!: number;
}

export class RecipePaginationResponseDto {
  @ApiProperty({ example: 2, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 6, minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 7, minimum: 0 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}

export class RecipeListResponseDto {
  @ApiProperty({ type: [RecipeResponseDto] })
  recipes!: RecipeResponseDto[];
}

export class PaginatedRecipeListResponseDto extends RecipeListResponseDto {
  @ApiProperty({ type: RecipePaginationResponseDto })
  pagination!: RecipePaginationResponseDto;
}

export class TaxonomyCategoryResponseDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Soups' })
  name!: string;

  @ApiProperty({ example: 3 })
  recipe_count!: number;
}

export class TaxonomyMealResponseDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Dinner' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Hearty evening meals' })
  description!: string | null;

  @ApiProperty({ example: 2 })
  recipe_count!: number;
}

export class CategoriesResponseDto {
  @ApiProperty({ type: [TaxonomyCategoryResponseDto] })
  categories!: TaxonomyCategoryResponseDto[];
}

export class MealsResponseDto {
  @ApiProperty({ type: [TaxonomyMealResponseDto] })
  meals!: TaxonomyMealResponseDto[];
}

export class RecipeDetailResponseDto {
  @ApiProperty({ type: RecipeResponseDto })
  recipe!: RecipeResponseDto;
}

export class RatingAggregateResponseDto {
  @ApiProperty({ example: 4.5 })
  overall_score!: number;

  @ApiProperty({ example: 12 })
  num_ratings!: number;
}

export class RatingMutationResponseDto {
  @ApiProperty({ example: 'Rating saved successfully' })
  message!: string;

  @ApiProperty({ type: RatingAggregateResponseDto })
  aggregate!: RatingAggregateResponseDto;
}

export class RatingRemovalResponseDto {
  @ApiProperty({ example: 'Rating removed successfully' })
  message!: string;

  @ApiProperty({ type: RatingAggregateResponseDto })
  aggregate!: RatingAggregateResponseDto;
}

export class RatingResponseDto {
  @ApiProperty({ example: 21 })
  rating_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ type: String, example: 'https://example.com/pasta.jpg', nullable: true })
  image_url!: string | null;

  @ApiProperty({ example: 5 })
  score!: number;

  @ApiProperty({ type: String, example: 'Delicious!', nullable: true })
  review!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  date_added!: string | null;
}

export class RatingsListResponseDto {
  @ApiProperty({ type: [RatingResponseDto] })
  ratings!: RatingResponseDto[];
}

export class ReviewResponseDto {
  @ApiProperty({ example: 21 })
  rating_id!: number;

  @ApiProperty({ example: 5 })
  score!: number;

  @ApiProperty({ type: String, example: 'Delicious!', nullable: true })
  review!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  date_added!: string | null;

  @ApiProperty({ example: 'Ada Lovelace' })
  full_name!: string;
}

export class ReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews!: ReviewResponseDto[];

  @ApiProperty({ type: RatingAggregateResponseDto })
  aggregate!: RatingAggregateResponseDto;
}

export class WishlistItemResponseDto {
  @ApiProperty({ type: RecipeResponseDto })
  recipe!: RecipeResponseDto;

  @ApiProperty({ example: '2026-08-23T06:30:00.000Z', format: 'date-time' })
  savedAt!: string;
}

export class WishlistResponseDto {
  @ApiProperty({ type: [WishlistItemResponseDto] })
  wishlist!: WishlistItemResponseDto[];
}

export class CollectionResponseDto {
  @ApiProperty({ example: 4 })
  collection_id!: number;

  @ApiProperty({ example: 'Weeknight dinners' })
  name!: string;

  @ApiProperty({ example: 12 })
  recipe_count!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;
}

export class CollectionsResponseDto {
  @ApiProperty({ type: [CollectionResponseDto] })
  collections!: CollectionResponseDto[];
}

export class ReviewReportResponseDto {
  @ApiProperty({ example: 9 })
  report_id!: number;

  @ApiProperty({ example: 21 })
  rating_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'spam' })
  reason!: string;

  @ApiProperty({ example: 'open' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;
}

export class MealPlanItemResponseDto {
  @ApiProperty({ example: 12 })
  item_id!: number;

  @ApiProperty({ example: 4 })
  plan_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ example: '2026-08-25', format: 'date' })
  planned_date!: string;

  @ApiProperty({ example: 'dinner' })
  slot!: string;

  @ApiProperty({ example: 4 })
  servings!: number;
}

export class MealPlanResponseDto {
  @ApiProperty({ example: 4 })
  plan_id!: number;

  @ApiProperty({ example: 'Weekly family meals' })
  name!: string;

  @ApiProperty({ example: '2026-08-24', format: 'date' })
  start_date!: string;

  @ApiProperty({ example: '2026-08-30', format: 'date' })
  end_date!: string;

  @ApiProperty({ type: [MealPlanItemResponseDto] })
  items?: MealPlanItemResponseDto[];
}

export class ShoppingListItemResponseDto {
  @ApiProperty({ example: 4 })
  item_id!: number;

  @ApiProperty({ example: 'Tomatoes' })
  label!: string;

  @ApiProperty({ type: String, nullable: true, example: '500 g' })
  quantity!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 15 })
  source_recipe_id!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Pasta Carbonara' })
  source_recipe_name!: string | null;

  @ApiProperty({ example: false })
  checked!: boolean;
}

export class ShoppingListResponseDto {
  @ApiProperty({ type: [ShoppingListItemResponseDto] })
  items!: ShoppingListItemResponseDto[];
}

export class UploadGrantResponseDto {
  @ApiProperty({ example: 'https://storage.example/upload/sign/recipes%2F7%2Fimage.webp' })
  uploadUrl!: string;

  @ApiProperty({ example: 'recipes/7/1f8a8c2d.webp' })
  objectPath!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ example: 'image/webp' })
  contentType!: string;

  @ApiProperty({ example: 5242880 })
  maxBytes!: number;
}
