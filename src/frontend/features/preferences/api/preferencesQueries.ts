import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import {
	getFoodPreferences,
	replaceFoodPreferences,
	type FoodPreferences,
} from "./preferencesApi";

export const preferencesQueryKeys = {
	all: ["food-preferences"] as const,
	forUser: (userId: number) => [...preferencesQueryKeys.all, userId] as const,
};

export const useFoodPreferencesQuery = () => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: preferencesQueryKeys.forUser(userId),
		queryFn: getFoodPreferences,
		enabled: userId > 0,
	});
};

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
