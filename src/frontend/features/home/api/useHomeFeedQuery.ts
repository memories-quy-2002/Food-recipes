import type { RecipeSummary } from '@/shared/api/contracts';
import { useQuery } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { HomeFeedResponse } from "@/shared/api/contracts";

export const createHomeFeedQueryKey = (isAuthenticated: boolean) => [
	"home-feed",
	isAuthenticated ? "personalized" : "public",
] as const;

export const getHomeFeedRoute = (isAuthenticated: boolean) =>
	isAuthenticated ? apiRoutes.userHomeFeed : apiRoutes.homeFeed;

export const HOME_FEED_DISCOVERY_LIMIT = 24;

export const getHomeFeedRecipes = (
	data: HomeFeedResponse | undefined,
): RecipeSummary[] => {
	const recipes: RecipeSummary[] = [];
	const seen = new Set<number>();

	for (const section of data?.sections ?? []) {
		for (const recipe of section.recipes ?? []) {
			if (seen.has(recipe.recipe_id)) continue;
			seen.add(recipe.recipe_id);
			recipes.push(recipe);
			if (recipes.length >= HOME_FEED_DISCOVERY_LIMIT) return recipes;
		}
	}

	return recipes;
};

export const fetchHomeFeed = async (
	isAuthenticated: boolean,
	signal?: AbortSignal,
): Promise<HomeFeedResponse> => {
	const response = await axios.get<HomeFeedResponse>(getHomeFeedRoute(isAuthenticated), {
		signal,
	});
	return response.data;
};

export const useHomeFeedQuery = (isAuthenticated: boolean) =>
	useQuery({
		queryKey: createHomeFeedQueryKey(isAuthenticated),
		queryFn: ({ signal }) => fetchHomeFeed(isAuthenticated, signal),
		staleTime: 60_000,
		retry: 1,
	});
