import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { RecipeListResponse } from "@/shared/api/contracts";
import { parseRecipeListPayload } from "@/features/food/api/useRecipesQuery";

export const HOME_SEARCH_MIN_LENGTH = 2;
export const HOME_SEARCH_LIMIT = 8;
export const HOME_SEARCH_DEBOUNCE_MS = 250;

const normalizeSearchTerm = (value: string | null | undefined) =>
	typeof value === "string" ? value.trim() : "";

export const shouldSearchRecipes = (value: string | null | undefined) =>
	normalizeSearchTerm(value).length >= HOME_SEARCH_MIN_LENGTH;

export const createHomeSearchQueryKey = (value: string) => [
	"home-recipe-search",
	normalizeSearchTerm(value),
] as const;

export const createHomeSearchRequestParams = (value: string) => ({
	q: normalizeSearchTerm(value),
	limit: HOME_SEARCH_LIMIT,
});

const fetchHomeSearchResults = async (searchTerm: string, signal?: AbortSignal): Promise<RecipeListResponse> => {
	const response = await axios.get(apiRoutes.recipes, {
		params: createHomeSearchRequestParams(searchTerm),
		signal,
	});
	return parseRecipeListPayload(response.data);
};

export const useHomeSearchQuery = (searchTerm: string) => {
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() => normalizeSearchTerm(searchTerm));

	useEffect(() => {
		const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
		const timeoutId = window.setTimeout(() => setDebouncedSearchTerm(normalizedSearchTerm), HOME_SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(timeoutId);
	}, [searchTerm]);

	return useQuery({
		queryKey: createHomeSearchQueryKey(debouncedSearchTerm),
		queryFn: ({ signal }) => fetchHomeSearchResults(debouncedSearchTerm, signal),
		enabled: shouldSearchRecipes(debouncedSearchTerm),
		staleTime: 30_000,
	});
};
