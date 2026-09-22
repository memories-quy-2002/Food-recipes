import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveCookingSession } from "./cookingSessionApi";
import { createCookingHistory, getCookingRecap, getRecipeCookingMemory, listCookingHistory, type CreateCookingHistoryInput } from "./historyApi";
import { useToast } from "@/app/ToastProvider";

export const historyQueryKeys = {
	all: ["cooking-history"] as const,
	recap: (userId: number) => ["cooking-recap", userId] as const,
	recipeMemory: (userId: number, recipeId: number) => ["recipe-cooking-memory", userId, recipeId] as const,
	activeSession: ["cooking-session", "active"] as const,
};

export const useCookingHistoryQuery = () => useQuery({
	queryKey: historyQueryKeys.all,
	queryFn: ({ signal }) => listCookingHistory(signal),
});

export const useCookingRecapQuery = (userId: number) => useQuery({
	queryKey: historyQueryKeys.recap(userId),
	queryFn: ({ signal }) => getCookingRecap(signal),
	enabled: userId > 0,
});

export const useRecipeCookingMemoryQuery = (userId: number, recipeId: number) => useQuery({
	queryKey: historyQueryKeys.recipeMemory(userId, recipeId),
	queryFn: ({ signal }) => getRecipeCookingMemory(recipeId, signal),
	enabled: userId > 0 && recipeId > 0,
});

export const useActiveCookingSessionQuery = () => useQuery({
	queryKey: historyQueryKeys.activeSession,
	queryFn: ({ signal }) => getActiveCookingSession(undefined, signal),
});

export const useCreateCookingHistoryMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (input: CreateCookingHistoryInput) => createCookingHistory(input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: historyQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: ["cooking-recap"] }),
				queryClient.invalidateQueries({ queryKey: ["recipe-cooking-memory"] }),
			]);
			showToast({ title: "Cooking history saved" });
		},
		onError: () => showToast({ title: "Couldn’t save cooking history", message: "Please try again.", type: "error" }),
	});
};
