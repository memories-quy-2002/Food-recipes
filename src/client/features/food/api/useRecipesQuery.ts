import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";

export const RECIPE_DISCOVERY_ENDPOINT = apiRoutes.recipes;
export const DEFAULT_RECIPE_LIMIT = 6;
const supportedSorts = new Set(["popular", "rating", "name"]);

export type RecipeDiscoveryState = {
	q: string;
	categoryId: string;
	mealId: string;
	sort: "popular" | "rating" | "name";
	page: number;
	limit: number;
};

const positiveInteger = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
		page: positiveInteger(params.get("page"), 1),
		limit: positiveInteger(params.get("limit"), DEFAULT_RECIPE_LIMIT),
	};
};

export const createRecipeQueryKey = (state: RecipeDiscoveryState) => ["recipes", state] as const;

export const createRecipeRequestParams = (state: RecipeDiscoveryState) => {
	const params: Record<string, number | string> = {};
	if (state.q.trim()) params.search = state.q.trim();
	if (/^\d+$/.test(state.categoryId)) params.categoryId = Number(state.categoryId);
	if (/^\d+$/.test(state.mealId)) params.mealId = Number(state.mealId);
	return params;
};

const fetchRecipes = async ({ queryKey, signal }) => {
	const [, state] = queryKey;
	const response = await axios.get(RECIPE_DISCOVERY_ENDPOINT, {
		// The current NestJS DTO supports these three filters only. Keep URL sort/page/limit
	// in the key for shareable state, but do not invent unsupported server fields.
		params: createRecipeRequestParams(state),
		signal,
	});
	return getArrayPayload(response.data, "recipes");
};

export const useRecipesQuery = (state: RecipeDiscoveryState) => useQuery({
	queryKey: createRecipeQueryKey(state),
	queryFn: fetchRecipes,
	placeholderData: keepPreviousData,
});
