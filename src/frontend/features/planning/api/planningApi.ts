import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type DateRange = {
	from: string;
	to: string;
};

export type MealPlan = {
	plan_id: number;
	name: string;
	start_date: string;
	end_date: string;
	created_at: string;
	updated_at: string;
};

export type MealPlanItem = {
	item_id: number;
	plan_id: number;
	recipe_id: number;
	recipe_name: string;
	planned_date: string;
	slot: MealSlot;
	servings: number;
	cooking_status?: "planned" | "cooking" | "completed";
	created_at: string;
};

export type MealPlanListResponse = { plans: MealPlan[] };
export type MealPlanResponse = { plan: MealPlan; items: MealPlanItem[] };
export type MealPlanItemResponse = { item: MealPlanItem };
export type MessageResponse = { message: string };

export type SavedRecipeReference = {
	recipe_id?: number;
	recipe?: { recipe_id?: number };
};

export type CreateMealPlanInput = DateRange & { name: string };

export type AddMealPlanItemInput = {
	recipeId: number;
	date: string;
	slot: MealSlot;
	servings: number;
};

export type UpdateMealPlanItemInput = Partial<AddMealPlanItemInput>;

export const listSavedRecipeIds = async (): Promise<number[]> => {
	const response = await axios.get<{ wishlist?: SavedRecipeReference[] }>(apiRoutes.userWishlist);
	const wishlist = response.data.wishlist ?? [];

	return wishlist.flatMap((entry) => {
		const recipeId = entry.recipe?.recipe_id ?? entry.recipe_id;
		return typeof recipeId === "number" ? [recipeId] : [];
	});
};

export const listMealPlans = async (
	range?: DateRange,
	signal?: AbortSignal,
): Promise<MealPlanListResponse> => {
	const response = await axios.get<MealPlanListResponse>(apiRoutes.mealPlans, {
		params: range,
		signal,
	});
	return response.data;
};

export const getMealPlan = async (
	planId: number,
	signal?: AbortSignal,
): Promise<MealPlanResponse> => {
	const response = await axios.get<MealPlanResponse>(apiRoutes.mealPlan(planId), {
		signal,
	});
	return response.data;
};

export const createMealPlan = async (
	input: CreateMealPlanInput,
): Promise<MealPlanResponse> => {
	const response = await axios.post<MealPlanResponse>(apiRoutes.mealPlans, input);
	return response.data;
};

export const addMealPlanItem = async (
	planId: number,
	input: AddMealPlanItemInput,
): Promise<MealPlanItemResponse> => {
	const response = await axios.post<MealPlanItemResponse>(
		apiRoutes.mealPlanItems(planId),
		input,
	);
	return response.data;
};

export const updateMealPlanItem = async (
	planId: number,
	itemId: number,
	input: UpdateMealPlanItemInput,
): Promise<MealPlanItemResponse> => {
	const response = await axios.patch<MealPlanItemResponse>(
		apiRoutes.mealPlanItem(planId, itemId),
		input,
	);
	return response.data;
};

export const deleteMealPlanItem = async (
	planId: number,
	itemId: number,
): Promise<MessageResponse> => {
	const response = await axios.delete<MessageResponse>(
		apiRoutes.mealPlanItem(planId, itemId),
	);
	return response.data;
};
