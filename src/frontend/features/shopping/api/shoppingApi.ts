import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { PERSONAL_KITCHEN, type KitchenScope } from "@/features/households/householdScope";

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

export type PreparedIngredient = {
	position: number;
	ingredient_name: string;
	required_quantity: number | null;
	required_unit: string | null;
	available_quantity: number | null;
	missing_quantity: number | null;
	pantry_id: number | null;
	status: "available" | "missing" | "needs_details";
};

export type PrepareRecipeResponse = {
	recipe_id: number;
	recipe_name: string;
	servings: number;
	ingredients: PreparedIngredient[];
	added_shopping_items: number;
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

export type ShoppingApiRoutes = {
	shoppingList: string;
	shoppingListItems: string;
	shoppingListItem: (itemId: number) => string;
	shoppingListFromRecipe: string;
	shoppingListPrepare: string;
	shoppingListCompleted: string;
};

export const createShoppingRoutes = (scope: KitchenScope): ShoppingApiRoutes => {
	if (scope.kind === "personal") {
		return {
			shoppingList: apiRoutes.shoppingList,
			shoppingListItems: apiRoutes.shoppingListItems,
			shoppingListItem: apiRoutes.shoppingListItem,
			shoppingListFromRecipe: apiRoutes.shoppingListFromRecipe,
			shoppingListPrepare: apiRoutes.shoppingListPrepare,
			shoppingListCompleted: apiRoutes.shoppingListCompleted,
		};
	}

	const shoppingList = `/households/${scope.householdId}/shopping-list`;
	return {
		shoppingList,
		shoppingListItems: `${shoppingList}/items`,
		shoppingListItem: (itemId) => `${shoppingList}/items/${itemId}`,
		shoppingListFromRecipe: `${shoppingList}/from-recipe`,
		shoppingListPrepare: `${shoppingList}/prepare`,
		shoppingListCompleted: `${shoppingList}/completed`,
	};
};

export const listShoppingItems = async (
	scope: KitchenScope = PERSONAL_KITCHEN,
	signal?: AbortSignal,
): Promise<ShoppingListResponse> => {
	const route = createShoppingRoutes(scope).shoppingList;
	const response = signal
		? await axios.get<ShoppingListResponse>(route, { signal })
		: await axios.get<ShoppingListResponse>(route);
	return response.data;
};

export const addShoppingItem = async (
	input: AddShoppingItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<ShoppingListItemResponse> => {
	const response = await axios.post<ShoppingListItemResponse>(
		createShoppingRoutes(scope).shoppingListItems,
		input,
	);
	return response.data;
};

export const updateShoppingItem = async (
	itemId: number,
	input: UpdateShoppingItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<ShoppingListItemResponse> => {
	const response = await axios.patch<ShoppingListItemResponse>(
		createShoppingRoutes(scope).shoppingListItem(itemId),
		input,
	);
	return response.data;
};

export const deleteShoppingItem = async (
	itemId: number,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<ShoppingListMessageResponse> => {
	const response = await axios.delete<ShoppingListMessageResponse>(
		createShoppingRoutes(scope).shoppingListItem(itemId),
	);
	return response.data;
};

export const clearCompletedShoppingItems = async (
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<ClearCompletedResponse> => {
	const response = await axios.delete<ClearCompletedResponse>(
		createShoppingRoutes(scope).shoppingListCompleted,
	);
	return response.data;
};

export const addRecipeIngredients = async (
	recipeId: number,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<AddRecipeIngredientsResponse> => {
	const response = await axios.post<AddRecipeIngredientsResponse>(
		createShoppingRoutes(scope).shoppingListFromRecipe,
		{ recipeId },
	);
	return response.data;
};

export const addRecipeIngredientsFromRecipes = async (
	recipeIds: number[],
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<AddRecipeIngredientsResponse> => {
	const response = await axios.post<AddRecipeIngredientsResponse>(
		createShoppingRoutes(scope).shoppingListFromRecipe,
		{ recipeIds },
	);
	return response.data;
};

export const prepareRecipeIngredients = async (
	recipeId: number,
	servings?: number,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<PrepareRecipeResponse> => {
	const response = await axios.post<PrepareRecipeResponse>(
		createShoppingRoutes(scope).shoppingListPrepare,
		{ recipeId, ...(servings ? { servings } : {}) },
	);
	return response.data;
};
