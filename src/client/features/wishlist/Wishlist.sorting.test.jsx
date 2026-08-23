import { describe, expect, it } from "vitest";
import { byRecentlySaved, normalizeSavedRecipe } from "./Wishlist";

describe("Recently Saved sorting", () => {
	it("sorts nested wishlist items by savedAt descending", () => {
		const savedRecipes = [
			normalizeSavedRecipe({
				recipe: { recipe_id: 1 },
				savedAt: "2026-08-20T10:00:00.000Z",
			}),
			normalizeSavedRecipe({
				recipe: { recipe_id: 2 },
				savedAt: "2026-08-23T10:00:00.000Z",
			}),
		];

		expect(
			savedRecipes.sort(byRecentlySaved).map(({ recipe }) => recipe.recipe_id)
		).toEqual([2, 1]);
	});
});
