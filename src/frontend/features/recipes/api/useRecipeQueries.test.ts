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
	prep_time_minutes: 10,
	cook_time_minutes: 20,
	total_time_minutes: 30,
	date_added: null,
	image_url: null,
	user_id: 1,
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

	it("rejects when pagination does not advance to a later page", async () => {
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

		await expect(fetchAllRecipes({ signal })).rejects.toThrow(/pagination/i);
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it.each([
		{
			name: "missing pagination",
			nextPage: { recipes: [nestRecipe] },
		},
		{
			name: "malformed pagination",
			nextPage: {
				recipes: [nestRecipe],
				pagination: {
					page: 2,
					limit: 100,
					total: 101,
					totalPages: 2,
					hasNext: "no",
				},
			},
		},
		{
			name: "inconsistent pagination",
			nextPage: {
				recipes: [nestRecipe],
				pagination: {
					page: 2,
					limit: 100,
					total: 201,
					totalPages: 3,
					hasNext: false,
				},
			},
		},
	])("rejects a requested page with $name metadata", async ({ nextPage }) => {
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
			.mockResolvedValueOnce({ data: nextPage });

		await expect(fetchAllRecipes({ signal })).rejects.toThrow(/pagination/i);
		expect(axios.get).toHaveBeenCalledTimes(2);
	});

	it.each([
		{
			name: "huge totalPages",
			pagination: {
				page: 1,
				limit: 100,
				total: 101,
				totalPages: Number.MAX_SAFE_INTEGER,
				hasNext: true,
			},
		},
		{
			name: "inconsistent totalPages",
			pagination: {
				page: 1,
				limit: 100,
				total: 201,
				totalPages: 2,
				hasNext: true,
			},
		},
	])("rejects malformed initial $name metadata", async ({ pagination }) => {
		vi.mocked(axios.get).mockResolvedValueOnce({
			data: { recipes: [recipe], pagination },
		});

		await expect(fetchAllRecipes({ signal })).rejects.toThrow(/pagination/i);
		expect(axios.get).toHaveBeenCalledTimes(1);
	});

	it("rejects when a valid catalog exceeds the aggregation page cap", async () => {
		let page = 0;
		vi.mocked(axios.get).mockImplementation(async () => {
			page += 1;
			return {
				data: {
					recipes: [{ ...recipe, recipe_id: page }],
					pagination: {
						page,
						limit: 100,
						total: 100_001,
						totalPages: 1_001,
						hasNext: page < 1_001,
					},
				},
			};
		});

		await expect(fetchAllRecipes({ signal })).rejects.toThrow(/maximum.*1,?000.*pages/i);
		expect(axios.get).toHaveBeenCalledTimes(1_000);
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

	it("propagates recipe detail failures instead of serving a stale offline snapshot", async () => {
		vi.mocked(axios.get).mockResolvedValueOnce({ data: { recipe } });
		await fetchRecipe({ queryKey: recipeQueryKeys.detail(7), signal });

		vi.mocked(axios.get).mockRejectedValueOnce(new Error("network unavailable"));

		await expect(fetchRecipe({ queryKey: recipeQueryKeys.detail(7), signal })).rejects.toThrow("network unavailable");
	});
});
