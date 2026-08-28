import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/app/ToastProvider";
import {
	getFoodPreferences,
	replaceFoodPreferences,
	type FoodPreferences,
} from "./preferencesApi";

export const preferencesQueryKeys = {
	all: ["food-preferences"] as const,
};

export const useFoodPreferencesQuery = () =>
	useQuery({
		queryKey: preferencesQueryKeys.all,
		queryFn: getFoodPreferences,
	});

export const useUpdateFoodPreferencesMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (preferences: FoodPreferences) =>
			replaceFoodPreferences(preferences),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKeys.all,
			});
			showToast({ title: "Preferences saved" });
		},
		onError: () =>
			showToast({
				title: "Couldn’t save your preferences",
				message: "Please try again.",
				type: "error",
			}),
	});
};
