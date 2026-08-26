import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type CookingSessionStatus = "active" | "paused" | "completed" | "abandoned";

export type CookingSession = {
	session_id: number;
	user_id: number;
	recipe_id: number;
	recipe_name: string;
	meal_plan_item_id: number | null;
	planned_date: string | null;
	slot: string | null;
	servings: number;
	current_step: number;
	status: CookingSessionStatus;
	started_at: string;
	last_active_at: string;
	paused_at: string | null;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
};

export type CookingSessionResponse = { session: CookingSession | null };
export type CookingSessionStartResponse = { session: CookingSession };
export type CookingSessionCompletionResponse = {
	session: CookingSession;
	history: CookingHistoryItem;
};

export type CookingHistoryItem = {
	history_id: number;
	user_id: number;
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

export type StartCookingSessionInput = {
	recipeId: number;
	mealPlanItemId?: number;
	servings?: number;
};

export const getActiveCookingSession = async (
	recipeId?: number,
	signal?: AbortSignal,
): Promise<CookingSessionResponse> => {
	const response = await axios.get<CookingSessionResponse>(apiRoutes.cookingSession, {
		params: recipeId ? { recipeId } : undefined,
		signal,
	});
	return response.data;
};

export const startCookingSession = async (
	input: StartCookingSessionInput,
): Promise<CookingSessionStartResponse> => {
	const response = await axios.post<CookingSessionStartResponse>(apiRoutes.cookingSession, input);
	return response.data;
};

export const updateCookingSession = async (
	sessionId: number,
	input: { currentStep?: number; status?: Extract<CookingSessionStatus, "active" | "paused"> },
): Promise<CookingSessionStartResponse> => {
	const response = await axios.patch<CookingSessionStartResponse>(apiRoutes.cookingSessionItem(sessionId), input);
	return response.data;
};

export const completeCookingSession = async (
	sessionId: number,
): Promise<CookingSessionCompletionResponse> => {
	const response = await axios.post<CookingSessionCompletionResponse>(apiRoutes.cookingSessionComplete(sessionId));
	return response.data;
};

export const abandonCookingSession = async (sessionId: number): Promise<{ message: string }> => {
	const response = await axios.delete<{ message: string }>(apiRoutes.cookingSessionItem(sessionId));
	return response.data;
};
