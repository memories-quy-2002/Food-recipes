import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/app/ToastProvider";
import type { HomeFeedResponse } from "@/shared/api/contracts";
import { dismissRecommendation } from "./recommendationsApi";

export const useDismissRecommendationMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (recipeId: number) => dismissRecommendation(recipeId),
		onMutate: async (recipeId) => {
			await queryClient.cancelQueries({ queryKey: ["home-feed"] });
			const previousFeed = queryClient.getQueryData<HomeFeedResponse>([
				"home-feed",
				"personalized",
			]);
			if (previousFeed) {
				queryClient.setQueryData<HomeFeedResponse>(
					["home-feed", "personalized"],
					{
						...previousFeed,
						sections: previousFeed.sections.map((section) =>
							section.key !== "recommended"
								? section
								: {
										...section,
										recipes: section.recipes.filter(
											(recipe) => recipe.recipe_id !== recipeId,
										),
									},
							),
					},
				);
			}
			return { previousFeed };
		},
		onError: (_error, _recipeId, context) => {
			if (context?.previousFeed) {
				queryClient.setQueryData(["home-feed", "personalized"], context.previousFeed);
			}
			showToast({ title: "Couldn’t hide this recommendation", message: "Please try again.", type: "error" });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
			showToast({ title: "Recommendation hidden" });
		},
	});
};
