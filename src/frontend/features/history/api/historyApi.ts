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
