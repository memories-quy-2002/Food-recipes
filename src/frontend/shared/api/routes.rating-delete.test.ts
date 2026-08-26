import { describe, expect, it } from "vitest";
import { apiRoutes } from "./routes";

describe("rating delete API contract", () => {
	it("exposes the ownership-preserving Nest delete route", () => {
		expect(apiRoutes.userRecipeRatingDelete(15)).toBe("/recipes/15/rating");
	});
});
