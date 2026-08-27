export type CatalogItem = {
	id: number;
	name: string;
};

type RecipeSummaryBase = {
	recipe_id: number;
	recipe_name: string;
	recipe_description: string | null;
	date_added: string | null;
	image_url: string | null;
	meal_id?: number;
	meal_name?: string;
	meal_description?: string | null;
	category_id?: number;
	category_name?: string;
	overall_score?: number;
	num_ratings?: number;
	dietary_tags?: string[];
	nutrition?: RecipeNutrition | null;
};

export type NestRecipeSummary = RecipeSummaryBase & {
	prep_time?: never;
	cook_time?: never;
	prep_time_minutes: number;
	cook_time_minutes: number;
	total_time_minutes: number;
	user_id: number;
	full_name?: string | null;
};

export type RecipeSummary = NestRecipeSummary;

export type RecipeStatus = "draft" | "published" | "archived";

export type StructuredIngredient = {
	id?: number;
	position?: number;
	quantity?: number | null;
	quantityText?: string | null;
	quantity_text?: string | null;
	unit?: string | null;
	unit_text?: string | null;
	name: string;
	preparation?: string | null;
	preparation_text?: string | null;
	originalText?: string | null;
	original_text?: string | null;
};

export type RecipeNutrition = {
	servings?: number | null;
	calories?: number | null;
	protein?: number | null;
	carbohydrates?: number | null;
	fat?: number | null;
	fiber?: number | null;
	sugar?: number | null;
	sodium?: number | null;
};

export type RecipeMetadata = {
	nutrition: {
		calories_per_serving: number | null;
		protein_grams: number | null;
		carbohydrates_grams: number | null;
		fat_grams: number | null;
		fiber_grams: number | null;
		sugar_grams: number | null;
		sodium_milligrams: number | null;
		source: "provided_by_author" | "estimated" | "verified_external";
		source_reference: string | null;
	} | null;
	allergens: Array<{
		allergen_id?: number;
		name: string;
		source: "provided_by_author" | "estimated" | "verified_external";
		source_reference?: string | null;
	}>;
};

export type RecipeLifecycleMetadata = {
	status?: RecipeStatus;
	publishedAt?: string | null;
	archivedAt?: string | null;
	updatedAt?: string | null;
	structuredIngredients?: StructuredIngredient[];
	nutrition?: RecipeNutrition | null;
	dietaryTags?: string[];
	allergenTags?: string[];
};

export type RecipeDetail = RecipeSummary & RecipeLifecycleMetadata & {
	ingredients: string[] | null;
	instructions: string[] | null;
	structured_ingredients?: Array<StructuredIngredient & {
		ingredient_id?: number;
		recipe_id?: number;
		note?: string | null;
	}> | null;
	metadata?: RecipeMetadata;
};

export type RecipeDraftPayload = {
	name: string;
	description?: string;
	mealId: number;
	categoryId: number;
	prepTimeMinutes: number;
	cookTimeMinutes: number;
	ingredients?: string[];
	instructions?: string[];
	imageUrl?: string | null;
};

export type StructuredIngredientsPayload = {
	ingredients: StructuredIngredient[];
};

export type RecipeNutritionPayload = RecipeNutrition;

export type RecipeTagsPayload = {
	dietaryTags: string[];
	allergenTags: string[];
};

export type OwnerRecipe = RecipeSummary & RecipeLifecycleMetadata;

export type RecipePagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
};

export type RecipeListResponse = {
	recipes: RecipeSummary[];
	pagination?: RecipePagination;
};

export type HomeFeedSectionKey =
	| "continue"
	| "pantry"
	| "recommended"
	| "saved"
	| "quick"
	| "popular";

export type HomeFeedSection = {
	key: HomeFeedSectionKey;
	title: string;
	description: string;
	recipes: RecipeSummary[];
};

export type HomeFeedResponse = {
	personalized: boolean;
	sections: HomeFeedSection[];
	kitchen?: KitchenState;
};

export type KitchenActiveSession = {
	session_id: number;
	recipe_id: number;
	recipe_name: string;
	meal_plan_item_id: number | null;
	planned_date: string | null;
	slot: string | null;
	servings: number;
	current_step: number;
	total_steps: number;
	status: "active" | "paused";
	updated_at: string;
};

export type KitchenNextMeal = {
	item_id: number;
	plan_id: number;
	recipe_id: number;
	recipe_name: string;
	planned_date: string;
	slot: string;
	servings: number;
};

export type KitchenState = {
	active_session: KitchenActiveSession | null;
	next_meal: KitchenNextMeal | null;
	shopping: { open_items: number; completed_items: number };
	pantry: { available_items: number };
	progress: { saved_recipes: number; planned_meals: number; completed_cooks: number };
};

export type ApiErrorResponse = {
	statusCode: number;
	code: string;
	message: string;
	requestId: string | null;
};
