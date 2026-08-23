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

export type LegacyRecipeSummary = RecipeSummaryBase & {
	prep_time: string;
	cook_time: string;
	prep_time_minutes?: never;
	cook_time_minutes?: never;
	total_time_minutes?: never;
	user_id?: number;
	full_name?: string | null;
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

export type RecipeSummary = LegacyRecipeSummary | NestRecipeSummary;

export type RecipeDetail = RecipeSummary & {
	ingredients: string[] | null;
	instructions: string[] | null;
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
