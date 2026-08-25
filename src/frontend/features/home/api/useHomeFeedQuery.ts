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
