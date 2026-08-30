import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { PERSONAL_KITCHEN, scopeKey, type KitchenScope } from "@/features/households/householdScope";
import { createLeftover, listLeftovers, type CreateLeftoverInput, type LeftoverResponse } from "./leftoversApi";

export const leftoversQueryKeys = {
	all: ["leftovers"] as const,
	forUser: (userId: number, scope: KitchenScope) => ["leftovers", userId, scopeKey(scope)] as const,
};

export const useLeftoversQuery = (
	scope: KitchenScope = PERSONAL_KITCHEN,
	options: { enabled?: boolean } = {},
) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: leftoversQueryKeys.forUser(userId, scope),
		queryFn: ({ signal }) => listLeftovers(scope, signal),
		enabled: (options.enabled ?? true) && userId > 0,
	});
};

export const useCreateLeftoverMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useMutation<LeftoverResponse, Error, CreateLeftoverInput>({
		mutationFn: (input) => createLeftover(scope, input),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: leftoversQueryKeys.forUser(userId, scope) }),
				queryClient.invalidateQueries({ queryKey: ["planning", userId, scopeKey(scope)] }),
				queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
			]);
			showToast({ title: "Leftover saved" });
		},
		onError: () => showToast({ title: "Couldn’t save this leftover", message: "Please check the portions and try again.", type: "error" }),
	});
};
