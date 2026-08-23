import { describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import {
	fetchAllRecipes,
	fetchRecipe,
	recipeQueryKeys,
} from "./useRecipeQueries";

vi.mock("@/shared/api/axios", () => ({
	default: { get: vi.fn() },
}));

const recipe = {
	recipe_id: 7,
	recipe_name: "Tomato soup",
	recipe_description: null,
	prep_time: "00:10:00",
	cook_time: "00:20:00",
	date_added: null,
	image_url: null,
};
const signal = new AbortController().signal;

describe("recipe query contracts", () => {
	it("exposes stable list and detail query keys", () => {
		expect(recipeQueryKeys.all).toEqual(["recipes"]);
		expect(recipeQueryKeys.list()).toEqual(["recipes", "list"]);
		expect(recipeQueryKeys.detail(7)).toEqual(["recipes", "detail", "7"]);
	});

	it("normalizes the recipe list envelope through the current route", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: { recipes: [recipe] } });

		await expect(fetchAllRecipes({ signal })).resolves.toEqual([recipe]);
		expect(axios.get).toHaveBeenCalledWith("/recipes", { signal });
	});

	it("preserves the recipe detail envelope through the current detail route", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: { recipe } });

		await expect(
			fetchRecipe({
				queryKey: recipeQueryKeys.detail(7),
				signal,
			})
		).resolves.toEqual(recipe);
		expect(axios.get).toHaveBeenCalledWith("/recipes/7", { signal });
	});
});
