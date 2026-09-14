import { describe, expect, it } from "vitest";
import { apiRoutes } from "@/shared/api/routes";
import {
	createHomeFeedQueryKey,
	getHomeFeedRecipes,
	getHomeFeedRoute,
	HOME_FEED_DISCOVERY_LIMIT,
} from "./useHomeFeedQuery";

describe("home feed query contract", () => {
	it("separates public and personalized cache entries", () => {
		expect(createHomeFeedQueryKey(false)).toEqual(["home-feed", "public"]);
		expect(createHomeFeedQueryKey(true)).toEqual(["home-feed", "personalized"]);
	});

	it("uses the authenticated endpoint only for signed-in users", () => {
		expect(getHomeFeedRoute(false)).toBe(apiRoutes.homeFeed);
		expect(getHomeFeedRoute(true)).toBe(apiRoutes.userHomeFeed);
	});

	it("exposes the authenticated not-interested recommendation route", () => {
		expect(apiRoutes.userRecommendationNotInterested(42)).toBe(
			"/users/me/recommendations/not-interested/42",
		);
	});

	it("deduplicates and bounds discovery recipes from feed sections", () => {
		const recipes = getHomeFeedRecipes({
			personalized: false,
			sections: [
				{
					key: "quick",
					title: "Quick wins",
					description: "Fast",
					recipes: [
						{ recipe_id: 1, recipe_name: "One" },
						{ recipe_id: 2, recipe_name: "Two" },
					],
				},
				{
					key: "popular",
					title: "Popular",
					description: "Popular",
					recipes: [
						{ recipe_id: 2, recipe_name: "Two again" },
						{ recipe_id: 3, recipe_name: "Three" },
					],
				},
			],
		} as never);

		expect(recipes.map((recipe) => recipe.recipe_id)).toEqual([1, 2, 3]);
		expect(recipes.length).toBeLessThanOrEqual(HOME_FEED_DISCOVERY_LIMIT);
	});
});
