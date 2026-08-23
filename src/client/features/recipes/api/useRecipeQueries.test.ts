import { beforeEach, describe, expect, it, vi } from "vitest";
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
const nestRecipe = {
	recipe_id: 8,
	recipe_name: "Roasted vegetables",
	recipe_description: null,
	prep_time_minutes: 10,
	cook_time_minutes: 20,
	total_time_minutes: 30,
	date_added: null,
	image_url: null,
	user_id: 1,
};

describe("recipe query contracts", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("exposes stable list and detail query keys", () => {
		expect(recipeQueryKeys.all).toEqual(["recipes"]);
		expect(recipeQueryKeys.list()).toEqual(["recipes", "list"]);
		expect(recipeQueryKeys.detail(7)).toEqual(["recipes", "detail", "7"]);
	});

	it("preserves a legacy array response through the current route", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: [recipe] });

		await expect(fetchAllRecipes({ signal })).resolves.toEqual([recipe]);
		expect(axios.get).toHaveBeenCalledWith("/recipes", {
			params: { page: 1, limit: 100 },
			signal,
		});
	});

	it("preserves a non-paginated recipe envelope", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: { recipes: [recipe] } });

		await expect(fetchAllRecipes({ signal })).resolves.toEqual([recipe]);
		expect(axios.get).toHaveBeenCalledWith("/recipes", {
			params: { page: 1, limit: 100 },
			signal,
		});
	});

	it("aggregates sequential Nest pages with the bounded page size", async () => {
		vi.mocked(axios.get)
			.mockResolvedValueOnce({
				data: {
					recipes: [recipe],
					pagination: {
						page: 1,
						limit: 100,
						total: 101,
						totalPages: 2,
						hasNext: true,
					},
				},
			})
			.mockResolvedValueOnce({
				data: {
					recipes: [nestRecipe],
					pagination: {
						page: 2,
						limit: 100,
						total: 101,
						totalPages: 2,
						hasNext: false,
					},
				},
			});

		await expect(fetchAllRecipes({ signal })).resolves.toEqual([
			recipe,
			nestRecipe,
		]);
		expect(axios.get).toHaveBeenCalledTimes(2);
		expect(axios.get).toHaveBeenNthCalledWith(1, "/recipes", {
			params: { page: 1, limit: 100 },
			signal,
		});
		expect(axios.get).toHaveBeenNthCalledWith(2, "/recipes", {
			params: { page: 2, limit: 100 },
			signal,
		});
	});

	it("stops when pagination does not advance to a later page", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({
			data: {
				recipes: [recipe],
				pagination: {
					page: 1,
					limit: 100,
					total: 101,
					totalPages: 2,
					hasNext: true,
				},
			},
		});
		vi.mocked(axios.get).mockResolvedValueOnce({
			data: {
				recipes: [nestRecipe],
				pagination: {
					page: 1,
					limit: 100,
					total: 101,
					totalPages: 2,
					hasNext: true,
				},
			},
		});

		await expect(fetchAllRecipes({ signal })).resolves.toEqual([recipe]);
		expect(axios.get).toHaveBeenCalledTimes(2);
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
