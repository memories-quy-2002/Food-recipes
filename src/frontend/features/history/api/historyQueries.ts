import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCookingHistory, listCookingHistory, type CreateCookingHistoryInput } from "./historyApi";

export const historyQueryKeys = { all: ["cooking-history"] as const };

export const useCookingHistoryQuery = () => useQuery({
	queryKey: historyQueryKeys.all,
	queryFn: ({ signal }) => listCookingHistory(signal),
});

export const useCreateCookingHistoryMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateCookingHistoryInput) => createCookingHistory(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: historyQueryKeys.all });
		},
	});
};
