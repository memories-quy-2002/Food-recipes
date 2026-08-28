import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { householdScope, PERSONAL_KITCHEN } from "@/features/households/householdScope";
import {
	addRecipeIngredients,
	addRecipeIngredientsFromRecipes,
	addShoppingItem,
	clearCompletedShoppingItems,
	createShoppingRoutes,
	deleteShoppingItem,
	listShoppingItems,
	prepareRecipeIngredients,
	updateShoppingItem,
} from "./shoppingApi";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

const mockedAxios = vi.mocked(axios);

describe("shopping list API", () => {
	beforeEach(() => vi.clearAllMocks());

	it("keeps personal routes unchanged and maps all household shopping routes", () => {
		const personalRoutes = createShoppingRoutes(PERSONAL_KITCHEN);
		const householdRoutes = createShoppingRoutes(householdScope(12));

		expect(personalRoutes.shoppingList).toBe("/users/me/shopping-list");
		expect(personalRoutes.shoppingListItems).toBe("/users/me/shopping-list/items");
		expect(personalRoutes.shoppingListItem(4)).toBe("/users/me/shopping-list/items/4");
		expect(personalRoutes.shoppingListFromRecipe).toBe("/users/me/shopping-list/from-recipe");
		expect(personalRoutes.shoppingListPrepare).toBe("/users/me/shopping-list/prepare");
		expect(personalRoutes.shoppingListCompleted).toBe("/users/me/shopping-list/completed");
		expect(householdRoutes.shoppingList).toBe("/households/12/shopping-list");
		expect(householdRoutes.shoppingListItems).toBe("/households/12/shopping-list/items");
		expect(householdRoutes.shoppingListItem(4)).toBe("/households/12/shopping-list/items/4");
		expect(householdRoutes.shoppingListFromRecipe).toBe("/households/12/shopping-list/from-recipe");
		expect(householdRoutes.shoppingListPrepare).toBe("/households/12/shopping-list/prepare");
		expect(householdRoutes.shoppingListCompleted).toBe("/households/12/shopping-list/completed");
	});

	it("lists the authenticated user's shopping items", async () => {
		mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

		await listShoppingItems();

		expect(mockedAxios.get).toHaveBeenCalledWith("/users/me/shopping-list");
	});

	it("adds a manual item without changing its free-text quantity", async () => {
		mockedAxios.post.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });

		await addShoppingItem({ label: "2 eggs", quantity: "large" });

		expect(mockedAxios.post).toHaveBeenCalledWith(
			"/users/me/shopping-list/items",
			{ label: "2 eggs", quantity: "large" },
		);
	});

	it("patches item state and deletes an owned item", async () => {
		mockedAxios.patch.mockResolvedValueOnce({ data: { item: { item_id: 4, checked: true } } });
		mockedAxios.delete.mockResolvedValueOnce({ data: { message: "removed" } });

		await updateShoppingItem(4, { checked: true });
		await deleteShoppingItem(4);

		expect(mockedAxios.patch).toHaveBeenCalledWith(
			"/users/me/shopping-list/items/4",
			{ checked: true },
		);
		expect(mockedAxios.delete).toHaveBeenCalledWith("/users/me/shopping-list/items/4");
	});

	it("clears completed items and imports recipe ingredients through dedicated routes", async () => {
		mockedAxios.delete.mockResolvedValueOnce({ data: { removed: 2 } });
		mockedAxios.post.mockResolvedValueOnce({ data: { recipe: "Chicken Curry", items: [] } });

		await clearCompletedShoppingItems();
		await addRecipeIngredients(15);

		expect(mockedAxios.delete).toHaveBeenCalledWith("/users/me/shopping-list/completed");
		expect(mockedAxios.post).toHaveBeenCalledWith("/users/me/shopping-list/from-recipe", {
			recipeId: 15,
		});
	});

	it("imports multiple planned recipes through the consolidation route", async () => {
		mockedAxios.post.mockResolvedValueOnce({ data: { recipes: ["Pasta", "Omelette"], items: [] } });

		await addRecipeIngredientsFromRecipes([15, 16]);

		expect(mockedAxios.post).toHaveBeenCalledWith("/users/me/shopping-list/from-recipe", {
			recipeIds: [15, 16],
		});
	});

	it("prepares a recipe against the pantry through the server-owned route", async () => {
		mockedAxios.post.mockResolvedValueOnce({ data: { recipe_id: 15, ingredients: [], added_shopping_items: 2 } });

		await prepareRecipeIngredients(15, 4);

		expect(mockedAxios.post).toHaveBeenCalledWith("/users/me/shopping-list/prepare", {
			recipeId: 15,
			servings: 4,
		});
	});

	it("uses the household scope for shopping reads and mutations", async () => {
		const scope = householdScope(12);
		mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
		mockedAxios.post
			.mockResolvedValueOnce({ data: { item: { item_id: 4 } } })
			.mockResolvedValueOnce({ data: { recipe: "Curry", items: [] } })
			.mockResolvedValueOnce({ data: { recipe_id: 15, ingredients: [], added_shopping_items: 1 } });
		mockedAxios.patch.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });
		mockedAxios.delete
			.mockResolvedValueOnce({ data: { message: "removed" } })
			.mockResolvedValueOnce({ data: { removed: 1 } });

		await listShoppingItems(scope);
		await addShoppingItem({ label: "Rice" }, scope);
		await updateShoppingItem(4, { checked: true }, scope);
		await deleteShoppingItem(4, scope);
		await addRecipeIngredients(15, scope);
		await prepareRecipeIngredients(15, 4, scope);
		await clearCompletedShoppingItems(scope);

		expect(mockedAxios.get).toHaveBeenCalledWith("/households/12/shopping-list");
		expect(mockedAxios.post).toHaveBeenNthCalledWith(1, "/households/12/shopping-list/items", { label: "Rice" });
		expect(mockedAxios.patch).toHaveBeenCalledWith("/households/12/shopping-list/items/4", { checked: true });
		expect(mockedAxios.delete).toHaveBeenNthCalledWith(1, "/households/12/shopping-list/items/4");
		expect(mockedAxios.post).toHaveBeenNthCalledWith(2, "/households/12/shopping-list/from-recipe", { recipeId: 15 });
		expect(mockedAxios.post).toHaveBeenNthCalledWith(3, "/households/12/shopping-list/prepare", { recipeId: 15, servings: 4 });
		expect(mockedAxios.delete).toHaveBeenNthCalledWith(2, "/households/12/shopping-list/completed");
	});
});
