import { describe, expect, it } from "vitest";
import type { WishlistRecipe } from "./FavoriteRecipe";
import {
	getVisibleSavedEntries,
	getVisibleSavedRecipes,
	normalizeSavedRecipe,
} from "./Wishlist";

describe("Recently Saved sorting", () => {
	it("derives nested Saved items in valid savedAt descending order", () => {
		const recipes: WishlistRecipe[] = [
			{ recipe_id: 1, recipe_name: "Older", overall_score: 5 },
			{ recipe_id: 2, recipe_name: "Newest", overall_score: 4 },
		];

		const wishlist = [
			{ recipe: { recipe_id: 1 }, savedAt: "2026-08-20T10:00:00.000Z" },
			{ recipe: { recipe_id: 2 }, savedAt: "2026-08-23T10:00:00.000Z" },
		];

		expect(getVisibleSavedRecipes(recipes, wishlist).map((recipe) => recipe.recipe_id)).toEqual([2, 1]);
	});

	it("normalizes flat wishlist items and applies search and sort", () => {
		const recipes = [
			{ recipe_id: 1, recipe_name: "Apple Pie", overall_score: 4 },
			{ recipe_id: 2, recipe_name: "Banana Bread", overall_score: 5 },
		];

		const wishlist = [
			{ recipe_id: 1 },
			{ recipe_id: 2, savedAt: "2026-08-23T10:00:00.000Z" },
		];

		expect(
			getVisibleSavedRecipes(recipes, wishlist, "bread", "name").map(
				(recipe) => recipe.recipe_id
			)
		).toEqual([2]);
	});

	it("places invalid or missing savedAt entries deterministically last", () => {
		const recipes = [
			{ recipe_id: 1, recipe_name: "Missing" },
			{ recipe_id: 2, recipe_name: "Invalid" },
			{ recipe_id: 3, recipe_name: "Valid" },
		];
		const wishlist = [
			{ recipe_id: 1 },
			{ recipe_id: 2, savedAt: "not-a-date" },
			{ recipe_id: 3, savedAt: "2026-08-23T10:00:00.000Z" },
		];

		expect(getVisibleSavedRecipes(recipes, wishlist).map((recipe) => recipe.recipe_id)).toEqual([3, 1, 2]);
	});

	it("normalizes timestamp aliases without inventing a save date", () => {
		expect(
			normalizeSavedRecipe({ recipe_id: 4, date_added: "2026-08-21T10:00:00.000Z" })
		).toMatchObject({ recipe: { recipe_id: 4 }, savedAt: "2026-08-21T10:00:00.000Z" });
		expect(normalizeSavedRecipe({ recipe_id: 5 })).toMatchObject({
			recipe: { recipe_id: 5 },
		savedAt: null,
	});
	});

	it("uses name and id tie-breakers for equal or unavailable recent dates", () => {
		const recipes = [
			{ recipe_id: 9, recipe_name: "Ziti", overall_score: 4 },
			{ recipe_id: 8, recipe_name: "Apple soup", overall_score: 4 },
			{ recipe_id: 7, recipe_name: "Apple soup", overall_score: 4 },
		];
		const wishlist = [
			{ recipe_id: 9 },
			{ recipe_id: 8, savedAt: "not-a-date" },
			{ recipe_id: 7 },
		];

		expect(getVisibleSavedRecipes(recipes, wishlist).map((recipe) => recipe.recipe_id)).toEqual([7, 9, 8]);
	});

	it("keeps savedAt attached to entries for rendered saved metadata", () => {
		const entries = getVisibleSavedEntries(
			[{ recipe_id: 1, recipe_name: "Soup", overall_score: 5 }],
			[{ recipe: { recipe_id: 1 }, savedAt: "2026-08-23T10:00:00.000Z" }]
		);

		expect(entries[0]).toMatchObject({
			recipe: { recipe_id: 1 },
			savedAt: "2026-08-23T10:00:00.000Z",
		});
	});
});
