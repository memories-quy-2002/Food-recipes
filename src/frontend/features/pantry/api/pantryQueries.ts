import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPantryItem, deletePantryItem, listPantry, updatePantryItem } from "./pantryApi";
import { useToast } from "@/app/ToastProvider";

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
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (input: { name: string; have?: boolean }) => createPantryItem(input),
		onSuccess: async () => { await invalidatePantry(queryClient); showToast({ title: "Pantry item added" }); },
		onError: () => showToast({ title: "Couldn’t add that pantry item", message: "Please try again.", type: "error" }),
	});
};

export const useUpdatePantryItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ pantryId, input }: { pantryId: number; input: { name?: string; have?: boolean } }) => updatePantryItem(pantryId, input),
		onSuccess: async () => { await invalidatePantry(queryClient); showToast({ title: "Pantry updated" }); },
		onError: () => showToast({ title: "Couldn’t update your pantry", message: "Please try again.", type: "error" }),
	});
};

export const useDeletePantryItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (pantryId: number) => deletePantryItem(pantryId),
		onSuccess: async () => { await invalidatePantry(queryClient); showToast({ title: "Pantry item removed" }); },
		onError: () => showToast({ title: "Couldn’t remove that pantry item", message: "Please try again.", type: "error" }),
	});
};
