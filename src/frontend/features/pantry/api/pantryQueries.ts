import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPantryItem, deletePantryItem, listPantry, updatePantryItem } from "./pantryApi";

export const pantryQueryKeys = { all: ["pantry"] as const };

export const usePantryQuery = () => useQuery({
	queryKey: pantryQueryKeys.all,
	queryFn: ({ signal }) => listPantry(signal),
});

const invalidatePantry = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await queryClient.invalidateQueries({ queryKey: pantryQueryKeys.all });
};

export const useCreatePantryItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { name: string; have?: boolean }) => createPantryItem(input),
		onSuccess: () => invalidatePantry(queryClient),
	});
};

export const useUpdatePantryItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ pantryId, input }: { pantryId: number; input: { name?: string; have?: boolean } }) => updatePantryItem(pantryId, input),
		onSuccess: () => invalidatePantry(queryClient),
	});
};

export const useDeletePantryItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (pantryId: number) => deletePantryItem(pantryId),
		onSuccess: () => invalidatePantry(queryClient),
	});
};
