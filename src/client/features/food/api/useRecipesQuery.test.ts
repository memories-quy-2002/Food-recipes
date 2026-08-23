import { describe, expect, it } from "vitest";
import {
	createRecipeQueryKey,
	createRecipeRequestParams,
	parseRecipeDiscoveryState,
} from "./useRecipesQuery";

describe("recipe discovery query state", () => {
	it("derives the complete discovery state from the URL", () => {
		expect(
			parseRecipeDiscoveryState(
				"?q=pasta&categoryId=2&mealId=3&sort=rating&page=2&limit=12"
			)
		).toEqual({
			q: "pasta",
			categoryId: "2",
			mealId: "3",
			sort: "rating",
			page: 2,
			limit: 12,
		});
	});

	it("maps only contract-supported filters to the request", () => {
		const state = parseRecipeDiscoveryState(
			"?q=pasta&categoryId=2&mealId=3&sort=rating&page=2&limit=12"
		);

		expect(createRecipeRequestParams(state)).toEqual({
			search: "pasta",
			categoryId: 2,
			mealId: 3,
		});
	});

	it("includes every URL-derived value in the query key", () => {
		const state = parseRecipeDiscoveryState("?q=soup&page=3");

		expect(createRecipeQueryKey(state)).toEqual(["recipes", state]);
	});
});
