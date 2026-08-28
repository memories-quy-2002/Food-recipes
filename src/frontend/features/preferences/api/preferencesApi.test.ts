import { describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { getFoodPreferences, replaceFoodPreferences } from "./preferencesApi";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		put: vi.fn(),
	},
}));

const preferences = {
	diet: "vegan",
	avoidedAllergens: ["peanuts"],
	dislikedIngredients: ["cilantro"],
	preferredCuisines: ["Vietnamese"],
	cookingSkill: "intermediate",
	maxWeekdayCookMinutes: 30,
	defaultServings: 2,
	maxCaloriesPerServing: 650,
	minProteinGrams: 30,
	strictDislikes: false,
};

describe("preferencesApi", () => {
	it("gets the authenticated user's food preferences", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: preferences });

		await expect(getFoodPreferences()).resolves.toEqual(preferences);

		expect(axios.get).toHaveBeenCalledWith(apiRoutes.userFoodPreferences);
	});

	it("replaces the authenticated user's food preferences", async () => {
		vi.mocked(axios.put).mockResolvedValueOnce({ data: preferences });

		await expect(replaceFoodPreferences(preferences)).resolves.toEqual(preferences);

		expect(axios.put).toHaveBeenCalledWith(apiRoutes.userFoodPreferences, preferences);
	});
});
