import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type ShoppingListItem = {
	item_id: number;
	label: string;
	quantity: string | null;
	source_recipe_id: number | null;
	source_recipe_name: string | null;
	checked: boolean;
};

export type ShoppingListResponse = { items: ShoppingListItem[] };
export type ShoppingListItemResponse = { item: ShoppingListItem };
export type ShoppingListMessageResponse = { message: string };
export type ClearCompletedResponse = { removed: number };
export type AddRecipeIngredientsResponse = {
	recipe?: string;
	recipes?: string[];
	items: ShoppingListItem[];
};

export type AddShoppingItemInput = {
	label: string;
	quantity?: string;
	};

export type UpdateShoppingItemInput = {
	label?: string;
	quantity?: string;
	checked?: boolean;
};

export const listShoppingItems = async (signal?: AbortSignal): Promise<ShoppingListResponse> => {
	const response = signal
		? await axios.get<ShoppingListResponse>(apiRoutes.shoppingList, { signal })
		: await axios.get<ShoppingListResponse>(apiRoutes.shoppingList);
	return response.data;
};

export const addShoppingItem = async (
	input: AddShoppingItemInput,
): Promise<ShoppingListItemResponse> => {
	const response = await axios.post<ShoppingListItemResponse>(
		apiRoutes.shoppingListItems,
		input,
	);
	return response.data;
};

export const updateShoppingItem = async (
	itemId: number,
	input: UpdateShoppingItemInput,
): Promise<ShoppingListItemResponse> => {
	const response = await axios.patch<ShoppingListItemResponse>(
		apiRoutes.shoppingListItem(itemId),
		input,
	);
	return response.data;
};

export const deleteShoppingItem = async (
	itemId: number,
): Promise<ShoppingListMessageResponse> => {
	const response = await axios.delete<ShoppingListMessageResponse>(
		apiRoutes.shoppingListItem(itemId),
	);
	return response.data;
};

export const clearCompletedShoppingItems = async (): Promise<ClearCompletedResponse> => {
	const response = await axios.delete<ClearCompletedResponse>(apiRoutes.shoppingListCompleted);
	return response.data;
};

export const addRecipeIngredients = async (
	recipeId: number,
): Promise<AddRecipeIngredientsResponse> => {
	const response = await axios.post<AddRecipeIngredientsResponse>(
		apiRoutes.shoppingListFromRecipe,
		{ recipeId },
	);
	return response.data;
};

export const addRecipeIngredientsFromRecipes = async (
	recipeIds: number[],
): Promise<AddRecipeIngredientsResponse> => {
	const response = await axios.post<AddRecipeIngredientsResponse>(
		apiRoutes.shoppingListFromRecipe,
		{ recipeIds },
	);
	return response.data;
};
