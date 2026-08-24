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

export type RecipeMetadata = {
	nutrition: {
		calories_per_serving: number;
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

export type RecipeDetail = RecipeSummary & {
	ingredients: string[] | null;
	instructions: string[] | null;
	structured_ingredients?: Array<{
		ingredient_id?: number;
		recipe_id?: number;
		name: string;
		quantity?: number | null;
		unit?: string | null;
		note?: string | null;
		position?: number;
	}> | null;
	metadata?: RecipeMetadata;
};

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
