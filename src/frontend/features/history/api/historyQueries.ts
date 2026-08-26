import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveCookingSession } from "./cookingSessionApi";
import { createCookingHistory, listCookingHistory, type CreateCookingHistoryInput } from "./historyApi";
import { useToast } from "@/app/ToastProvider";

export const historyQueryKeys = {
	all: ["cooking-history"] as const,
	activeSession: ["cooking-session", "active"] as const,
};

export const useCookingHistoryQuery = () => useQuery({
	queryKey: historyQueryKeys.all,
	queryFn: ({ signal }) => listCookingHistory(signal),
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
			await queryClient.invalidateQueries({ queryKey: historyQueryKeys.all });
			showToast({ title: "Cooking history saved" });
		},
		onError: () => showToast({ title: "Couldn’t save cooking history", message: "Please try again.", type: "error" }),
	});
};
