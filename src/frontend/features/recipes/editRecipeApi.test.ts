import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { loadOwnedRecipe } from "./editRecipeApi";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
	},
}));

const mockAxiosGet = vi.mocked(axios.get);

describe("loadOwnedRecipe", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("selects the requested recipe from the owner-scoped response", async () => {
		mockAxiosGet.mockResolvedValue({ data: { recipes: [{ recipe_id: 42, recipe_name: "Tomato pasta" }] } });

		await expect(loadOwnedRecipe(42)).resolves.toMatchObject({ recipe_id: 42 });
		expect(mockAxiosGet).toHaveBeenCalledWith(apiRoutes.userRecipes, { params: { status: "all" } });
	});

	it("rejects a recipe absent from the owner response", async () => {
		mockAxiosGet.mockResolvedValue({ data: { recipes: [] } });

		await expect(loadOwnedRecipe(42)).rejects.toMatchObject({ code: "OWNED_RECIPE_NOT_FOUND" });
	});
});
