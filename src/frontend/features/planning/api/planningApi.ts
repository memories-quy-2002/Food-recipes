import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { PERSONAL_KITCHEN, type KitchenScope } from "@/features/households/householdScope";

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
	source_type?: "recipe" | "leftover" | "external";
	leftover_batch_id?: number | null;
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

export type AddLeftoverMealPlanItemInput = {
	leftoverBatchId: number;
	date: string;
	slot: MealSlot;
	servings: number;
};

export type UpdateMealPlanItemInput = Partial<AddMealPlanItemInput>;

export type MealPlanPreviewItem = {
	recipeId: number;
	recipeName: string;
	date: string;
	slot: MealSlot;
	servings: number;
	locked: boolean;
	score: number;
	reasons: string[];
};

export type MealPlanPreview = {
	previewToken: string;
	name: string;
	from: string;
	to: string;
	targetMeals: number;
	items: MealPlanPreviewItem[];
};

export type GenerateMealPlanInput = DateRange & {
	name: string;
	targetMeals: number;
	slots?: Array<{ date: string; slot: MealSlot; servings: number }>;
	lockedItems?: Array<{ date: string; slot: MealSlot; servings: number; recipeId: number }>;
	excludedRecipeIds?: number[];
};

export type FromMealPlanPreviewInput = {
	previewToken: string;
	name?: string;
	items?: MealPlanPreviewItem[];
};

export type MealPlanPreviewResponse = MealPlanPreview;

type MealPlanApiRoutes = {
	mealPlans: string;
	mealPlan: (planId: number) => string;
	mealPlanItems: (planId: number) => string;
	mealPlanItem: (planId: number, itemId: number) => string;
	mealPlanLeftoverItems: (planId: number) => string;
};

const createMealPlanRoutes = (scope: KitchenScope): MealPlanApiRoutes => {
	if (scope.kind === "personal") {
		return {
			mealPlans: apiRoutes.mealPlans,
			mealPlan: apiRoutes.mealPlan,
			mealPlanItems: apiRoutes.mealPlanItems,
			mealPlanItem: apiRoutes.mealPlanItem,
			mealPlanLeftoverItems: (planId) => `${apiRoutes.mealPlanItems(planId)}/leftover`,
		};
	}

	const mealPlans = `/households/${scope.householdId}/meal-plans`;
	return {
		mealPlans,
		mealPlan: (planId) => `${mealPlans}/${planId}`,
		mealPlanItems: (planId) => `${mealPlans}/${planId}/items`,
		mealPlanItem: (planId, itemId) => `${mealPlans}/${planId}/items/${itemId}`,
		mealPlanLeftoverItems: (planId) => `${mealPlans}/${planId}/items/leftover`,
	};
};

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
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanListResponse> => {
	const response = await axios.get<MealPlanListResponse>(createMealPlanRoutes(scope).mealPlans, {
		params: range,
		signal,
	});
	return response.data;
};

export const getMealPlan = async (
	planId: number,
	signal?: AbortSignal,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanResponse> => {
	const response = await axios.get<MealPlanResponse>(createMealPlanRoutes(scope).mealPlan(planId), {
		signal,
	});
	return response.data;
};

export const createMealPlan = async (
	input: CreateMealPlanInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanResponse> => {
	const response = await axios.post<MealPlanResponse>(createMealPlanRoutes(scope).mealPlans, input);
	return response.data;
};

export const addMealPlanItem = async (
	planId: number,
	input: AddMealPlanItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanItemResponse> => {
	const response = await axios.post<MealPlanItemResponse>(
		createMealPlanRoutes(scope).mealPlanItems(planId),
		input,
	);
	return response.data;
};

export const addLeftoverMealPlanItem = async (
	planId: number,
	input: AddLeftoverMealPlanItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanItemResponse> => {
	const response = await axios.post<MealPlanItemResponse>(
		createMealPlanRoutes(scope).mealPlanLeftoverItems(planId),
		input,
	);
	return response.data;
};

export const updateMealPlanItem = async (
	planId: number,
	itemId: number,
	input: UpdateMealPlanItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MealPlanItemResponse> => {
	const response = await axios.patch<MealPlanItemResponse>(
		createMealPlanRoutes(scope).mealPlanItem(planId, itemId),
		input,
	);
	return response.data;
};

export const deleteMealPlanItem = async (
	planId: number,
	itemId: number,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<MessageResponse> => {
	const response = await axios.delete<MessageResponse>(
		createMealPlanRoutes(scope).mealPlanItem(planId, itemId),
	);
	return response.data;
};

export const generateMealPlanPreview = async (
	input: GenerateMealPlanInput,
): Promise<MealPlanPreviewResponse> => {
	const response = await axios.post<MealPlanPreviewResponse>(
		apiRoutes.mealPlanGeneratePreview,
		input,
	);
	return response.data;
};

export const createMealPlanFromPreview = async (
	input: FromMealPlanPreviewInput,
): Promise<MealPlanResponse> => {
	const response = await axios.post<MealPlanResponse>(
		apiRoutes.mealPlanFromPreview,
		input,
	);
	return response.data;
};
