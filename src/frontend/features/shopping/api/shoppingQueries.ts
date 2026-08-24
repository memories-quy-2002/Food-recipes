import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addRecipeIngredients,
	addShoppingItem,
	clearCompletedShoppingItems,
	deleteShoppingItem,
	listShoppingItems,
	updateShoppingItem,
	type AddShoppingItemInput,
	type UpdateShoppingItemInput,
} from "./shoppingApi";

export const shoppingQueryKeys = {
	all: ["shopping-list"] as const,
};

export const useShoppingListQuery = () =>
	useQuery({
		queryKey: shoppingQueryKeys.all,
		queryFn: ({ signal }) => listShoppingItems(signal),
	});

const invalidateShoppingList = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.all });
};

export const useAddShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: AddShoppingItemInput) => addShoppingItem(input),
		onSuccess: () => invalidateShoppingList(queryClient),
	});
};

export const useUpdateShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ itemId, input }: { itemId: number; input: UpdateShoppingItemInput }) =>
			updateShoppingItem(itemId, input),
		onSuccess: () => invalidateShoppingList(queryClient),
	});
};

export const useDeleteShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (itemId: number) => deleteShoppingItem(itemId),
		onSuccess: () => invalidateShoppingList(queryClient),
	});
};

export const useClearCompletedShoppingItemsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: clearCompletedShoppingItems,
		onSuccess: () => invalidateShoppingList(queryClient),
	});
};

export const useAddRecipeIngredientsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (recipeId: number) => addRecipeIngredients(recipeId),
		onSuccess: () => invalidateShoppingList(queryClient),
	});
};
