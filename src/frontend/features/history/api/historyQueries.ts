import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCookingHistory, listCookingHistory, type CreateCookingHistoryInput } from "./historyApi";
import { useToast } from "@/app/ToastProvider";

export const historyQueryKeys = { all: ["cooking-history"] as const };

export const useCookingHistoryQuery = () => useQuery({
	queryKey: historyQueryKeys.all,
	queryFn: ({ signal }) => listCookingHistory(signal),
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
