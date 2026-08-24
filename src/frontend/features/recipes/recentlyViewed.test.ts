// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
	getRecentlyViewedRecipeIds,
	recordRecentlyViewedRecipe,
} from "./recentlyViewed";

describe("recently viewed recipes", () => {
	let storage: Storage;

	beforeEach(() => {
		storage = window.localStorage;
		storage.clear();
	});

	it("keeps the newest visit first and caps the list", () => {
		for (let recipeId = 1; recipeId <= 22; recipeId += 1) {
			recordRecentlyViewedRecipe(storage, recipeId, new Date(recipeId * 1000));
		}

		expect(getRecentlyViewedRecipeIds(storage)).toHaveLength(20);
		expect(getRecentlyViewedRecipeIds(storage).slice(0, 2)).toEqual([22, 21]);
	});

	it("moves a revisited recipe to the front without duplicating it", () => {
		recordRecentlyViewedRecipe(storage, 1, new Date("2026-01-01T00:00:00Z"));
		recordRecentlyViewedRecipe(storage, 2, new Date("2026-01-02T00:00:00Z"));
		recordRecentlyViewedRecipe(storage, 1, new Date("2026-01-03T00:00:00Z"));

		expect(getRecentlyViewedRecipeIds(storage)).toEqual([1, 2]);
	});
});
