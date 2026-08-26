import { describe, expect, it } from "vitest";

globalThis.localStorage = { getItem: () => null };
globalThis.sessionStorage = { getItem: () => null };

const { getQuickMeals } = await import("./HomeMain");

describe("Quick Meals sorting", () => {
	it("derives Quick Meals in normalized total-duration order", () => {
		const recipes = [
			{
				recipe_id: 1,
				prep_time_minutes: 20,
				cook_time_minutes: 5,
			},
			{
				recipe_id: 2,
				prepTimeMinutes: 10,
				cookTimeMinutes: 4,
			},
		];

		expect(getQuickMeals(recipes).map((recipe) => recipe.recipe_id)).toEqual([2, 1]);
	});
});
