import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { PERSONAL_KITCHEN, scopeKey, type KitchenScope } from "@/features/households/householdScope";
import { createPantryItem, deletePantryItem, listPantry, updatePantryItem, type PantryItemInput } from "./pantryApi";

export const pantryQueryKeys = {
	all: ["pantry"] as const,
	forUser: (userId: number, scope: KitchenScope) =>
		[...pantryQueryKeys.all, userId, scopeKey(scope)] as const,
};

export const usePantryQuery = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: pantryQueryKeys.forUser(userId, scope),
		queryFn: ({ signal }) => listPantry(scope, signal),
		enabled: userId > 0,
	});
};

const invalidatePantry = async (
	queryClient: ReturnType<typeof useQueryClient>,
	userId: number,
	scope: KitchenScope,
) => {
	await queryClient.invalidateQueries({
		queryKey: pantryQueryKeys.forUser(userId, scope),
	});
};

export const useCreatePantryItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (input: PantryItemInput) => createPantryItem(input, scope),
		onSuccess: async () => { await invalidatePantry(queryClient, userId, scope); showToast({ title: "Pantry item added" }); },
		onError: () => showToast({ title: "Couldn’t add that pantry item", message: "Please try again.", type: "error" }),
	});
};

export const useUpdatePantryItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({ pantryId, input }: { pantryId: number; input: Partial<PantryItemInput> }) => updatePantryItem(pantryId, input, scope),
		onSuccess: async () => { await invalidatePantry(queryClient, userId, scope); showToast({ title: "Pantry updated" }); },
		onError: () => showToast({ title: "Couldn’t update your pantry", message: "Please try again.", type: "error" }),
	});
};

export const useDeletePantryItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (pantryId: number) => deletePantryItem(pantryId, scope),
		onSuccess: async () => { await invalidatePantry(queryClient, userId, scope); showToast({ title: "Pantry item removed" }); },
		onError: () => showToast({ title: "Couldn’t remove that pantry item", message: "Please try again.", type: "error" }),
	});
};
