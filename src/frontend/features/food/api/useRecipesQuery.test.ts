import { describe, expect, expectTypeOf, it } from "vitest";
import type { RecipeListResponse } from "@/shared/api/contracts";
import {
	createRecipeQueryKey,
	createRecipeRequestParams,
	MAX_RECIPE_LIMIT,
	MAX_RECIPE_PAGE,
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
			filter: "",
			page: 2,
			limit: 12,
		});
	});

	it("maps the complete server-side discovery contract to the request", () => {
		const state = parseRecipeDiscoveryState(
			"?q=pasta&categoryId=2&mealId=3&sort=rating&page=2&limit=12"
		);

		expect(createRecipeRequestParams(state)).toEqual({
			q: "pasta",
			categoryId: 2,
			mealId: 3,
			sort: "rating",
			page: 2,
			limit: 12,
		});
	});

	it("supports pantry-friendly filters and production sorting in the URL contract", () => {
		const state = parseRecipeDiscoveryState("?filter=high-protein&sort=quickest");

		expect(state.filter).toBe("high-protein");
		expect(state.sort).toBe("quickest");
		expect(createRecipeRequestParams(state)).toMatchObject({
			filter: "high-protein",
			sort: "quickest",
		});
	});

	it("keeps URL pagination within the API limit", () => {
		const state = parseRecipeDiscoveryState("?page=4&limit=1000");

		expect(state.limit).toBe(MAX_RECIPE_LIMIT);
		expect(createRecipeRequestParams(state)).toMatchObject({
			sort: "popular",
			page: 4,
			limit: MAX_RECIPE_LIMIT,
		});
	});

	it("bounds URL page values so the server offset remains safe", () => {
		const state = parseRecipeDiscoveryState("?page=999999999999");

		expect(state.page).toBe(MAX_RECIPE_PAGE);
		expect(createRecipeRequestParams(state)).toMatchObject({ page: MAX_RECIPE_PAGE });
	});

	it("includes every URL-derived value in the query key", () => {
		const state = parseRecipeDiscoveryState("?q=soup&page=3");

		expect(createRecipeQueryKey(state)).toEqual(["recipes", state]);
	});

	it("exposes typed recipe summaries from the query", () => {
		expectTypeOf<ReturnType<typeof useRecipesQuery>["data"]>().toEqualTypeOf<
			RecipeListResponse | undefined
		>();
	});

	it("accepts the Nest recipe list duration contract", () => {
		expect(
			parseRecipeListPayload({
				recipes: [
					{
						recipe_id: 1,
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
		).toEqual({
			recipes: [expect.objectContaining({ recipe_id: 1 })],
		});
	});

	it("parses pagination metadata without changing the recipe page", () => {
		expect(
			parseRecipeListPayload({
				recipes: [{
					recipe_id: 2,
					recipe_name: "Page two soup",
					recipe_description: null,
					prep_time_minutes: 10,
					cook_time_minutes: 20,
					total_time_minutes: 30,
					date_added: null,
					image_url: null,
					user_id: 7,
				}],
				pagination: { page: 2, limit: 1, total: 3, totalPages: 3, hasNext: true },
			})
		).toEqual({
			recipes: [expect.objectContaining({ recipe_id: 2 })],
			pagination: { page: 2, limit: 1, total: 3, totalPages: 3, hasNext: true },
		});
	});
});
