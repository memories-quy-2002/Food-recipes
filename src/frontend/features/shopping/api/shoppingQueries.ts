import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { PERSONAL_KITCHEN, scopeKey, type KitchenScope } from "@/features/households/householdScope";
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
import { pantryQueryKeys } from "@/features/pantry/api/pantryQueries";
import { importCheckedShoppingItems } from "@/features/pantry/api/pantryApi";

export const shoppingQueryKeys = {
	all: ["shopping-list"] as const,
	forUser: (userId: number, scope: KitchenScope) =>
		[...shoppingQueryKeys.all, userId, scopeKey(scope)] as const,
};

export const useShoppingListQuery = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: shoppingQueryKeys.forUser(userId, scope),
		queryFn: ({ signal }) => listShoppingItems(scope, signal),
		enabled: userId > 0,
	});
};

const invalidateShoppingList = async (
	queryClient: ReturnType<typeof useQueryClient>,
	userId: number,
	scope: KitchenScope,
) => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.forUser(userId, scope) }),
		queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
	]);
};

export const useAddShoppingItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (input: AddShoppingItemInput) => addShoppingItem(input, scope),
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Item added to your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t add that item", message: "Please try again.", type: "error" }),
	});
};

export const useUpdateShoppingItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({ itemId, input }: { itemId: number; input: UpdateShoppingItemInput }) => updateShoppingItem(itemId, input, scope),
		onMutate: async ({ itemId, input }) => {
			const cancelPromise = queryClient.cancelQueries({ queryKey: shoppingQueryKeys.forUser(userId, scope) });
			const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listShoppingItems>>>(shoppingQueryKeys.forUser(userId, scope));
			if (input.checked !== undefined) queryClient.setQueryData(shoppingQueryKeys.forUser(userId, scope), (current: Awaited<ReturnType<typeof listShoppingItems>> | undefined) => current ? { ...current, items: current.items.map((item) => item.item_id === itemId ? { ...item, checked: input.checked! } : item) } : current);
			await cancelPromise;
			return { previous };
		},
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Shopping list updated" }); },
		onError: (_error, _input, context) => { if (context?.previous) queryClient.setQueryData(shoppingQueryKeys.forUser(userId, scope), context.previous); showToast({ title: "Couldn’t update your shopping list", message: "Please try again.", type: "error" }); },
	});
};

export const useDeleteShoppingItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (itemId: number) => deleteShoppingItem(itemId, scope),
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Item removed from your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t remove that item", message: "Please try again.", type: "error" }),
	});
};

export const useClearCompletedShoppingItemsMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: () => clearCompletedShoppingItems(scope),
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Completed items cleared" }); },
		onError: () => showToast({ title: "Couldn’t clear completed items", message: "Please try again.", type: "error" }),
	});
};

export const useImportCheckedShoppingItemsMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: () => importCheckedShoppingItems(scope),
		onSuccess: async (result) => {
			await Promise.all([
				invalidateShoppingList(queryClient, userId, scope),
				queryClient.invalidateQueries({ queryKey: pantryQueryKeys.forUser(userId, scope) }),
			]);
			showToast({
				title: result.imported_items
					? `${result.imported_items} purchased item${result.imported_items === 1 ? "" : "s"} added to your pantry`
					: "No items were added to your pantry",
				message: result.skipped_items.length
					? `${result.skipped_items.length} item${result.skipped_items.length === 1 ? " needs" : "s need"} a numeric quantity and supported unit.`
					: undefined,
				type: result.skipped_items.length ? "error" : "success",
			});
		},
		onError: () => showToast({ title: "Couldn’t add purchased items to your pantry", message: "Please try again.", type: "error" }),
	});
};

export const useAddRecipeIngredientsMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (recipeId: number) => addRecipeIngredients(recipeId, scope),
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Recipe ingredients added to your shopping list" }); },
		onError: () => showToast({ title: "Couldn’t add recipe ingredients", message: "Please try again.", type: "error" }),
	});
};

export const useAddRecipeIngredientsFromRecipesMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (recipeIds: number[]) => addRecipeIngredientsFromRecipes(recipeIds, scope),
		onSuccess: async () => { await invalidateShoppingList(queryClient, userId, scope); showToast({ title: "Planned ingredients imported" }); },
		onError: () => showToast({ title: "Couldn’t import planned ingredients", message: "Please try again.", type: "error" }),
	});
};

export const usePrepareRecipeIngredientsMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({ recipeId, servings }: { recipeId: number; servings?: number }) =>
			prepareRecipeIngredients(recipeId, servings, scope),
		onSuccess: async (result) => {
			await invalidateShoppingList(queryClient, userId, scope);
			showToast({
				title: result.added_shopping_items
					? `${result.added_shopping_items} missing ingredient${result.added_shopping_items === 1 ? "" : "s"} added`
					: "This meal is ready to prepare",
			});
		},
		onError: () => showToast({ title: "Couldn’t prepare this meal", message: "Please try again.", type: "error" }),
	});
};
