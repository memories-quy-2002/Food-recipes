import axios from "@/shared/api/axios";
import { apiRoutes, type ApiRouteId } from "@/shared/api/routes";

export type RecommendationSignalResponse = {
	message: string;
};

export const dismissRecommendation = async (
	recipeId: ApiRouteId,
): Promise<RecommendationSignalResponse> => {
	const response = await axios.put<RecommendationSignalResponse>(
		apiRoutes.userRecommendationNotInterested(recipeId),
	);
	return response.data;
};

export const restoreRecommendation = async (
	recipeId: ApiRouteId,
): Promise<RecommendationSignalResponse> => {
	const response = await axios.delete<RecommendationSignalResponse>(
		apiRoutes.userRecommendationNotInterested(recipeId),
	);
	return response.data;
};
