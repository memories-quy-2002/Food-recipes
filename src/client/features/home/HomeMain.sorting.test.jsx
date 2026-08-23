import { describe, expect, it } from "vitest";

globalThis.localStorage = { getItem: () => null };
globalThis.sessionStorage = { getItem: () => null };

const { byQuickest, normalizeRecipeSummary } = await import("./HomeMain");

describe("Quick Meals sorting", () => {
	it("sorts recipes by normalized total duration", () => {
		const recipes = [
			normalizeRecipeSummary({
				recipe_id: 1,
				prep_time_minutes: 20,
				cook_time_minutes: 5,
			}),
			normalizeRecipeSummary({
				recipe_id: 2,
				prepTimeMinutes: 10,
				cookTimeMinutes: 4,
			}),
		];

		expect(recipes.sort(byQuickest).map((recipe) => recipe.recipe_id)).toEqual([
			2,
			1,
		]);
	});
});
