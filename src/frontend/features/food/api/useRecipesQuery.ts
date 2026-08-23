import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { RecipeListResponse, RecipePagination, RecipeSummary } from "@/shared/api/contracts";
import type { QueryFunctionContext } from "@tanstack/react-query";

export const RECIPE_DISCOVERY_ENDPOINT = (apiRoutes as { recipes: string }).recipes;
export const DEFAULT_RECIPE_LIMIT = 6;
export const MAX_RECIPE_PAGE = 1_000_000;
export const MAX_RECIPE_LIMIT = 100;
const supportedSorts = new Set(["popular", "rating", "name"]);

export type RecipeDiscoveryState = {
	q: string;
	categoryId: string;
	mealId: string;
	sort: "popular" | "rating" | "name";
	page: number;
	limit: number;
};

const positiveInteger = (
	value: string | null,
	fallback: number,
	maximum = Number.MAX_SAFE_INTEGER
) => {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0
		? Math.min(parsed, maximum)
		: fallback;
};

export const parseRecipeDiscoveryState = (
	search: string | URLSearchParams
): RecipeDiscoveryState => {
	const params = typeof search === "string" ? new URLSearchParams(search) : search;
	const sort = params.get("sort");

	return {
		q: params.get("q") || "",
		categoryId: params.get("categoryId") || params.get("categories") || "",
		mealId: params.get("mealId") || params.get("meals") || "",
		sort: supportedSorts.has(sort || "") ? (sort as RecipeDiscoveryState["sort"]) : "popular",
		page: positiveInteger(params.get("page"), 1, MAX_RECIPE_PAGE),
		limit: positiveInteger(params.get("limit"), DEFAULT_RECIPE_LIMIT, MAX_RECIPE_LIMIT),
	};
};

export const createRecipeQueryKey = (state: RecipeDiscoveryState) => ["recipes", state] as const;

export const createRecipeRequestParams = (state: RecipeDiscoveryState) => {
	const params: Record<string, number | string> = {
		sort: state.sort,
		page: Number.isSafeInteger(state.page) && state.page > 0
			? Math.min(state.page, MAX_RECIPE_PAGE)
			: 1,
		limit: Math.min(Math.max(state.limit, 1), MAX_RECIPE_LIMIT),
	};
	if (state.q.trim()) {
		const query = state.q.trim();
		params.q = query;
		// Express still consumes `search` while the Nest contract consumes `q`.
		params.search = query;
	}
	if (/^\d+$/.test(state.categoryId)) params.categoryId = Number(state.categoryId);
	if (/^\d+$/.test(state.mealId)) params.mealId = Number(state.mealId);
	return params;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isRecipeSummary = (value: unknown): value is RecipeSummary => {
	if (!isRecord(value)) return false;

	const hasCommonFields =
		typeof value.recipe_id === "number" &&
		typeof value.recipe_name === "string" &&
		(value.recipe_description === null || typeof value.recipe_description === "string") &&
		(value.date_added === null || typeof value.date_added === "string") &&
		(value.image_url === null || typeof value.image_url === "string");
	const isLegacyDuration =
		typeof value.prep_time === "string" && typeof value.cook_time === "string";
	const isNestDuration =
		typeof value.prep_time_minutes === "number" &&
		typeof value.cook_time_minutes === "number" &&
		typeof value.total_time_minutes === "number" &&
		typeof value.user_id === "number";

	return hasCommonFields && (isLegacyDuration || isNestDuration);
};

const parseRecipePagination = (value: unknown): RecipePagination | undefined => {
	if (!isRecord(value)) return undefined;
	const page = value.page;
	const limit = value.limit;
	const total = value.total;
	const totalPages = value.totalPages;
	if (
		typeof page !== "number" || !Number.isSafeInteger(page) || page < 1 || page > MAX_RECIPE_PAGE ||
		typeof limit !== "number" || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_RECIPE_LIMIT ||
		typeof total !== "number" || !Number.isSafeInteger(total) || total < 0 ||
		typeof totalPages !== "number" || !Number.isSafeInteger(totalPages) || totalPages < 0 ||
		typeof value.hasNext !== "boolean"
	) {
		return undefined;
	}
	return { page, limit, total, totalPages, hasNext: value.hasNext };
};

export const parseRecipeListPayload = (payload: unknown): RecipeListResponse => {
	const recipes = Array.isArray(payload)
		? payload
		: isRecord(payload) && Array.isArray(payload.recipes)
			? payload.recipes
			: [];

	const pagination = isRecord(payload) ? parseRecipePagination(payload.pagination) : undefined;
	return {
		recipes: recipes.filter(isRecipeSummary),
		...(pagination ? { pagination } : {}),
	};
};

const fetchRecipes = async ({
	queryKey,
	signal,
}: QueryFunctionContext<ReturnType<typeof createRecipeQueryKey>>): Promise<RecipeListResponse> => {
	const [, state] = queryKey;
	const response = await axios.get(RECIPE_DISCOVERY_ENDPOINT, {
		params: createRecipeRequestParams(state),
		signal,
	});
	return parseRecipeListPayload(response.data);
};

export const useRecipesQuery = (state: RecipeDiscoveryState) => useQuery({
	queryKey: createRecipeQueryKey(state),
	queryFn: fetchRecipes,
	placeholderData: keepPreviousData,
});
