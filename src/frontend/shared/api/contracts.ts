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
	unit?: string | null;
	name: string;
	preparation?: string | null;
	originalText?: string | null;
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

export type ApiErrorResponse = {
	statusCode: number;
	code: string;
	message: string;
	requestId: string | null;
};
