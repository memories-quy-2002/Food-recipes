import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type CookingHistoryItem = {
	history_id: number;
	recipe_id: number;
	recipe_name: string;
	meal_plan_item_id: number | null;
	planned_date: string | null;
	slot: string | null;
	servings: number;
	started_at: string;
	completed_at: string;
	created_at: string;
};

export type CookingHistoryResponse = { items: CookingHistoryItem[] };

export type CookingRecapResponse = {
	completed_cooks: number;
	unique_recipes: number;
	most_cooked: { recipe_id: number; recipe_name: string; cook_count: number } | null;
};

export type RecipeCookingMemoryResponse = {
	cook_count: number;
	latest_cook: {
		history_id: number;
		servings: number;
		completed_at: string;
		journal: { rating: number | null; would_cook_again: boolean | null; notes: string | null } | null;
	} | null;
};

export const getCookingRecap = async (signal?: AbortSignal): Promise<CookingRecapResponse> => {
	const response = await axios.get<CookingRecapResponse>(apiRoutes.cookingRecap, { signal });
	return response.data;
};

export const getRecipeCookingMemory = async (recipeId: number, signal?: AbortSignal): Promise<RecipeCookingMemoryResponse> => {
	const response = await axios.get<RecipeCookingMemoryResponse>(apiRoutes.recipeCookingMemory(recipeId), { signal });
	return response.data;
};
export type CookingHistoryItemResponse = { item: CookingHistoryItem };

export type CreateCookingHistoryInput = {
	recipeId: number;
	mealPlanItemId?: number;
	servings?: number;
	startedAt?: string;
	completedAt?: string;
};

export const listCookingHistory = async (signal?: AbortSignal): Promise<CookingHistoryResponse> => {
	const response = await axios.get<CookingHistoryResponse>(apiRoutes.cookingHistory, { signal });
	return response.data;
};

export const createCookingHistory = async (input: CreateCookingHistoryInput): Promise<CookingHistoryItemResponse> => {
	const response = await axios.post<CookingHistoryItemResponse>(apiRoutes.cookingHistory, input);
	return response.data;
};
