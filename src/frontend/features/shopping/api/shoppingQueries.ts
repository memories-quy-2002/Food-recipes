import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addRecipeIngredients,
	addRecipeIngredientsFromRecipes,
	prepareRecipeIngredients,
	addShoppingItem,
	clearCompletedShoppingItems,
	deleteShoppingItem,
	listShoppingItems,
	updateShoppingItem,
	type AddShoppingItemInput,
	type UpdateShoppingItemInput,
} from "./shoppingApi";
import { useToast } from "@/app/ToastProvider";

export const shoppingQueryKeys = {
	all: ["shopping-list"] as const,
};

export const useShoppingListQuery = () =>
	useQuery({
		queryKey: shoppingQueryKeys.all,
		queryFn: ({ signal }) => listShoppingItems(signal),
	});

const invalidateShoppingList = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.all }),
		queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
	]);
};

export const useAddShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (input: AddShoppingItemInput) => addShoppingItem(input),
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Item added to your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t add that item", message: "Please try again.", type: "error" }),
	});
};

export const useUpdateShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ itemId, input }: { itemId: number; input: UpdateShoppingItemInput }) =>
			updateShoppingItem(itemId, input),
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Shopping list updated" }); },
		onError: () => showToast({ title: "Couldn’t update your shopping list", message: "Please try again.", type: "error" }),
	});
};

export const useDeleteShoppingItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (itemId: number) => deleteShoppingItem(itemId),
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Item removed from your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t remove that item", message: "Please try again.", type: "error" }),
	});
};

export const useClearCompletedShoppingItemsMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: clearCompletedShoppingItems,
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Completed items cleared" }); },
		onError: () => showToast({ title: "Couldn’t clear completed items", message: "Please try again.", type: "error" }),
	});
};

export const useAddRecipeIngredientsMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (recipeId: number) => addRecipeIngredients(recipeId),
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Recipe ingredients added to your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t add recipe ingredients", message: "Please try again.", type: "error" }),
	});
};

export const useAddRecipeIngredientsFromRecipesMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (recipeIds: number[]) => addRecipeIngredientsFromRecipes(recipeIds),
		onSuccess: async () => { await invalidateShoppingList(queryClient); showToast({ title: "Planned ingredients imported" }); },
		onError: () => showToast({ title: "Couldn’t import planned ingredients", message: "Please try again.", type: "error" }),
	});
};

export const usePrepareRecipeIngredientsMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ recipeId, servings }: { recipeId: number; servings?: number }) =>
			prepareRecipeIngredients(recipeId, servings),
		onSuccess: async (result) => {
			await invalidateShoppingList(queryClient);
			showToast({
				title: result.added_shopping_items
					? `${result.added_shopping_items} missing ingredient${result.added_shopping_items === 1 ? "" : "s"} added`
					: "This meal is ready to prepare",
			});
		},
		onError: () => showToast({ title: "Couldn’t prepare this meal", message: "Please try again.", type: "error" }),
	});
};
