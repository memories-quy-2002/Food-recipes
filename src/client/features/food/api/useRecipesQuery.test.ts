import { describe, expect, expectTypeOf, it } from "vitest";
import type { RecipeSummary } from "@/shared/api/contracts";
import {
	createRecipeQueryKey,
	createRecipeRequestParams,
	parseRecipeListPayload,
	parseRecipeDiscoveryState,
	useRecipesQuery,
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

	it("exposes typed recipe summaries from the query", () => {
		expectTypeOf<ReturnType<typeof useRecipesQuery>["data"]>().toEqualTypeOf<
			RecipeSummary[] | undefined
		>();
	});

	it("accepts the legacy and Nest recipe list duration contracts", () => {
		expect(
			parseRecipeListPayload({
				recipes: [
					{
						recipe_id: 1,
						recipe_name: "Legacy soup",
						recipe_description: null,
						prep_time: "00:10:00",
						cook_time: "00:20:00",
						date_added: null,
						image_url: null,
					},
					{
						recipe_id: 2,
						recipe_name: "Nest soup",
						recipe_description: null,
						prep_time_minutes: 10,
						cook_time_minutes: 20,
						total_time_minutes: 30,
						date_added: null,
						image_url: null,
						user_id: 7,
					},
				],
			})
		).toHaveLength(2);
	});
});
