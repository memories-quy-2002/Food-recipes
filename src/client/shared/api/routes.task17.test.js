import { describe, expect, it } from "vitest";
import { apiTargets } from "./config";
import { getUserRecipeRatingRoute } from "./routes";

describe("rating mutation routes Task 17", () => {
	it("passes target-specific arguments without losing either API contract", () => {
		expect(
			getUserRecipeRatingRoute(apiTargets.LEGACY, 7, 15)
		).toBe("/users/7/ratings/15");
		expect(
			getUserRecipeRatingRoute(apiTargets.LEGACY, 7, 15)
		).not.toContain("undefined");
		expect(
			getUserRecipeRatingRoute(apiTargets.NEST, 7, 15)
		).toBe("/recipes/15/rating");
	});
});
