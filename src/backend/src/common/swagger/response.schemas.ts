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

  @ApiProperty({ type: Number, nullable: true, example: 7 })
  user_id!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 3 })
  household_id!: number | null;

  @ApiProperty({ example: 'Eggs' })
  name!: string;

  @ApiProperty({ example: true })
  have!: boolean;

  @ApiProperty({ type: Number, nullable: true, example: 2.5 })
  quantity!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'KILOGRAM' })
  unit!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  purchased_at!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  opened_at!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  expires_at!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'fridge' })
  storage_location!: string | null;

  @ApiProperty({ enum: ['none', 'fresh', 'use_soon', 'expired'] })
  expiry_status!: 'none' | 'fresh' | 'use_soon' | 'expired';

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

export class RecipeIngredientResponseDto {
  @ApiProperty({ example: 1 })
  recipe_ingredient_id!: number;

  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ type: Number, nullable: true, example: 1.5 })
  quantity!: number | null;

  @ApiProperty({ type: String, nullable: true, example: '1/2' })
  quantity_text!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'cup' })
  unit!: string | null;

  @ApiProperty({ example: 'Tomatoes' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: 'diced' })
  preparation!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '1 cup diced tomatoes' })
  original_text!: string | null;

  @ApiPropertyOptional({ example: 1 })
  ingredient_id?: number;

  @ApiPropertyOptional({ example: 15 })
  recipe_id?: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'diced' })
  note?: string | null;
}

export class RecipeNutritionResponseDto {
  @ApiProperty({ example: 4 })
  servings!: number;

  @ApiProperty({ type: Number, nullable: true, example: 425 })
  calories!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 18 })
  protein!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 52 })
  carbohydrates!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 12 })
  fat!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 5 })
  fiber!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 8 })
  sugar!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 620 })
  sodium!: number | null;
}

export class RecipeMetadataNutritionResponseDto {
  @ApiProperty({ example: 420, nullable: true })
  calories_per_serving!: number | null;

  @ApiPropertyOptional({ example: 28, nullable: true })
  protein_grams!: number | null;

  @ApiPropertyOptional({ example: 45, nullable: true })
  carbohydrates_grams!: number | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  fat_grams!: number | null;

  @ApiPropertyOptional({ example: 6, nullable: true })
  fiber_grams!: number | null;

  @ApiPropertyOptional({ example: 8, nullable: true })
  sugar_grams!: number | null;

  @ApiPropertyOptional({ example: 540, nullable: true })
  sodium_milligrams!: number | null;

  @ApiProperty({ example: 'provided_by_author' })
  source!: string;

  @ApiPropertyOptional({ example: 'Recipe card', nullable: true })
  source_reference!: string | null;
}

export class RecipeAllergenResponseDto {
  @ApiProperty({ example: 2 })
  allergen_id!: number;

  @ApiProperty({ example: 'peanuts' })
  name!: string;

  @ApiProperty({ example: 'provided_by_author' })
  source!: string;

  @ApiPropertyOptional({ example: 'Ingredient label checked', nullable: true })
  source_reference!: string | null;
}

export class RecipeMetadataResponseDto {
  @ApiProperty({ type: RecipeMetadataNutritionResponseDto, nullable: true })
  nutrition!: RecipeMetadataNutritionResponseDto | null;

  @ApiProperty({ type: [RecipeAllergenResponseDto] })
  allergens!: RecipeAllergenResponseDto[];
}

export class RecipeResponseDto {
  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ type: String, example: 'A quick weeknight pasta.', nullable: true })
  recipe_description!: string | null;

  @ApiProperty({ example: 10, nullable: true })
  prep_time_minutes!: number | null;

  @ApiProperty({ example: 20, nullable: true })
  cook_time_minutes!: number | null;

  @ApiProperty({ example: 30, nullable: true, description: 'Preparation plus cooking time in minutes' })
  total_time_minutes!: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  date_added!: string | null;

  @ApiProperty({ type: String, example: 'https://example.com/pasta.jpg', nullable: true })
  image_url!: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  ingredients?: string[] | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  instructions?: string[] | null;

  @ApiProperty({ enum: ['draft', 'published', 'archived'], example: 'published' })
  status!: 'draft' | 'published' | 'archived';

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  published_at!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  archived_at!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;

  @ApiProperty({ type: [RecipeIngredientResponseDto] })
  structured_ingredients!: RecipeIngredientResponseDto[];

  @ApiProperty({ type: RecipeNutritionResponseDto, nullable: true })
  nutrition!: RecipeNutritionResponseDto | null;

  @ApiProperty({ type: [String] })
  dietary_tags!: string[];

  @ApiProperty({ type: [String] })
  allergen_tags!: string[];

  @ApiPropertyOptional({ type: RecipeMetadataResponseDto })
  metadata?: RecipeMetadataResponseDto;

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

  @ApiProperty({ enum: ['planned', 'cooking', 'completed'] })
  cooking_status!: 'planned' | 'cooking' | 'completed';
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

export class ShoppingListPantryImportSkippedDto {
  @ApiProperty({ example: 12 })
  item_id!: number;

  @ApiProperty({ example: 'Fresh herbs' })
  label!: string;

  @ApiProperty({ type: String, nullable: true, example: 'a handful' })
  quantity!: string | null;

  @ApiProperty({ enum: ['quantity_or_unit_required', 'pantry_unit_conflict'] })
  reason!: 'quantity_or_unit_required' | 'pantry_unit_conflict';
}

export class ShoppingListPantryImportResponseDto {
  @ApiProperty({ example: 3 })
  imported_items!: number;

  @ApiProperty({ type: [ShoppingListPantryImportSkippedDto] })
  skipped_items!: ShoppingListPantryImportSkippedDto[];
}

export class PreparedIngredientResponseDto {
  @ApiProperty()
  position!: number;

  @ApiProperty()
  ingredient_name!: string;

  @ApiProperty({ type: Number, nullable: true })
  required_quantity!: number | null;

  @ApiProperty({ type: String, nullable: true })
  required_unit!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  available_quantity!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  missing_quantity!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  pantry_id!: number | null;

  @ApiProperty({ enum: ['available', 'missing', 'needs_details'] })
  status!: 'available' | 'missing' | 'needs_details';
}

export class PrepareRecipeResponseDto {
  @ApiProperty()
  recipe_id!: number;

  @ApiProperty()
  recipe_name!: string;

  @ApiProperty()
  servings!: number;

  @ApiProperty({ type: [PreparedIngredientResponseDto] })
  ingredients!: PreparedIngredientResponseDto[];

  @ApiProperty()
  added_shopping_items!: number;
}

export class CookingHistoryItemDto {
  @ApiProperty({ example: 24 })
  history_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ type: Number, nullable: true, example: 42 })
  meal_plan_item_id!: number | null;

  @ApiProperty({ type: String, format: 'date', nullable: true, example: '2026-08-25' })
  planned_date!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'dinner' })
  slot!: string | null;

  @ApiProperty({ example: 4 })
  servings!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  started_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  completed_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;
}

export class CookingHistoryItemResponseDto {
  @ApiProperty({ type: CookingHistoryItemDto })
  item!: CookingHistoryItemDto;
}

export class CookingHistoryResponseDto {
  @ApiProperty({ type: [CookingHistoryItemDto] })
  items!: CookingHistoryItemDto[];
}

export class CookingSessionDto {
  @ApiProperty({ example: 24 })
  session_id!: number;

  @ApiProperty({ example: 15 })
  recipe_id!: number;

  @ApiProperty({ example: 'Pasta Carbonara' })
  recipe_name!: string;

  @ApiProperty({ type: Number, nullable: true, example: 42 })
  meal_plan_item_id!: number | null;

  @ApiProperty({ type: String, format: 'date', nullable: true, example: '2026-08-25' })
  planned_date!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'dinner' })
  slot!: string | null;

  @ApiProperty({ example: 4 })
  servings!: number;

  @ApiProperty({ example: 2, description: 'Zero-based current instruction step' })
  current_step!: number;

  @ApiProperty({ enum: ['active', 'paused', 'completed', 'abandoned'], example: 'active' })
  status!: 'active' | 'paused' | 'completed' | 'abandoned';

  @ApiProperty({ type: String, format: 'date-time' })
  started_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  last_active_at!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  paused_at!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completed_at!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: string;
}

export class CookingSessionResponseDto {
  @ApiProperty({ type: CookingSessionDto, nullable: true })
  session!: CookingSessionDto | null;
}

export class CookingSessionCompletionResponseDto {
  @ApiProperty({ type: CookingSessionDto })
  session!: CookingSessionDto;

  @ApiProperty({ type: CookingHistoryItemDto })
  history!: CookingHistoryItemDto;
}

export class CookingShortageDto {
  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 'rice' })
  ingredient_name!: string;

  @ApiProperty({ example: 500 })
  required_quantity!: number;

  @ApiProperty({ example: 'GRAM' })
  required_unit!: string;

  @ApiProperty({ example: 300 })
  available_quantity!: number;

  @ApiProperty({ example: 200 })
  missing_quantity!: number;

  @ApiProperty({ type: Number, nullable: true, example: 8 })
  pantry_id!: number | null;
}

export class CookingSessionShoppingListResponseDto {
  @ApiProperty({ example: 'shopping_list_updated' })
  status!: 'shopping_list_updated';

  @ApiProperty({ type: CookingSessionDto })
  session!: CookingSessionDto;

  @ApiProperty({ type: [CookingShortageDto] })
  shortages!: CookingShortageDto[];

  @ApiProperty({ example: 2 })
  added_shopping_items!: number;
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
