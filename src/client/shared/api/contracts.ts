export type CatalogItem = {
	id: number;
	name: string;
};

export type RecipeSummary = {
	recipe_id: number;
	recipe_name: string;
	recipe_description: string | null;
	prep_time_minutes: number;
	cook_time_minutes: number;
	total_time_minutes: number;
	date_added: string | null;
	image_url: string | null;
	user_id: number;
	meal_id?: number;
	meal_name?: string;
	meal_description?: string | null;
	category_id?: number;
	category_name?: string;
	overall_score?: number;
	num_ratings?: number;
};

export type RecipeDetail = RecipeSummary & {
	ingredients: string[] | null;
	instructions: string[] | null;
	full_name?: string | null;
};

export type RecipeListResponse = {
	recipes: RecipeSummary[];
};

export type ApiErrorResponse = {
	statusCode: number;
	code: string;
	message: string;
	requestId: string | null;
};
