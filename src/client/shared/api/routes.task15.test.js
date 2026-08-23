import { describe, expect, it } from "vitest";
import { createApiRoutes } from "./routes";

describe("rating delete API contract Task 15", () => {
	it("exposes ownership-preserving delete only for the Nest contract", () => {
		const nestRoutes = createApiRoutes("nest");
		const legacyRoutes = createApiRoutes("legacy");

		expect(nestRoutes.userRecipeRatingDelete(7, 15)).toBe("/recipes/15/rating");
		expect(() => legacyRoutes.userRecipeRatingDelete(7, 15)).toThrow(
			"legacy Express API does not expose"
		);
	});
});
