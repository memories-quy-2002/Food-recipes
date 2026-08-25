import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { RecipeEditSaveError, saveRecipeEdits, type RecipeEditPayload } from "./recipeEditorApi";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		patch: vi.fn(),
		put: vi.fn(),
	},
}));

const fixturePayload: RecipeEditPayload = {
	base: {
		name: "Tomato pasta",
		description: "A quick pasta dinner.",
		mealId: 2,
		categoryId: 3,
		prepTimeMinutes: 15,
		cookTimeMinutes: 20,
		instructions: ["Simmer and serve."],
	},
	ingredients: { ingredients: [] },
	nutrition: { servings: null, calories: null },
	tags: { dietaryTags: [], allergenTags: [] },
};

describe("saveRecipeEdits", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(axios.patch).mockResolvedValue({ data: {} });
		vi.mocked(axios.put).mockResolvedValue({ data: {} });
		vi.mocked(axios.get).mockResolvedValue({ data: { recipe: { recipe_id: 42, recipe_name: "Tomato pasta" } } });
	});

	it("updates base data before replacing structured metadata", async () => {
		await expect(saveRecipeEdits(42, fixturePayload)).resolves.toMatchObject({ recipe_id: 42 });

		expect(axios.patch).toHaveBeenCalledWith(apiRoutes.recipe(42), fixturePayload.base);
		expect(axios.put).toHaveBeenNthCalledWith(1, apiRoutes.recipeIngredients(42), fixturePayload.ingredients);
		expect(axios.put).toHaveBeenNthCalledWith(2, apiRoutes.recipeNutrition(42), fixturePayload.nutrition);
		expect(axios.put).toHaveBeenNthCalledWith(3, apiRoutes.recipeDietaryTags(42), fixturePayload.tags);
	});

	it("does not report success when a metadata replacement fails", async () => {
		vi.mocked(axios.put)
			.mockResolvedValueOnce({ data: {} })
			.mockRejectedValueOnce(new Error("nutrition unavailable"));

		await expect(saveRecipeEdits(42, fixturePayload)).rejects.toMatchObject({
			message: "nutrition unavailable",
			section: "nutrition",
		});
		expect(axios.get).not.toHaveBeenCalled();
	});

	it("keeps intentionally empty structured sections in the replacement requests", async () => {
		await saveRecipeEdits(42, fixturePayload);

		expect(axios.put).toHaveBeenCalledWith(apiRoutes.recipeIngredients(42), { ingredients: [] });
		expect(axios.put).toHaveBeenCalledWith(apiRoutes.recipeDietaryTags(42), { dietaryTags: [], allergenTags: [] });
	});

	it("identifies the section that failed", async () => {
		vi.mocked(axios.patch).mockRejectedValueOnce(new Error("title is required"));

		await expect(saveRecipeEdits(42, fixturePayload)).rejects.toBeInstanceOf(RecipeEditSaveError);
	});
});
