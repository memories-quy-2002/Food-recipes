// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQueryClient } from "@tanstack/react-query";
import RecipeProvider, { RecipeContext } from "./RecipeProvider";
import { useAllRecipesQuery } from "@/features/recipes/api/useRecipeQueries";

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: vi.fn(),
}));

vi.mock("@/features/recipes/api/useRecipeQueries", () => ({
	recipeQueryKeys: { list: vi.fn(() => ["recipes", "list"]) },
	useAllRecipesQuery: vi.fn(),
}));

const Consumer = () => {
	const { recipes, isLoadingRecipes, recipesError, refreshRecipes } =
		React.useContext(RecipeContext);

	return (
		<>
			<div data-testid="recipe-count">{recipes.length}</div>
			<div data-testid="loading">{String(isLoadingRecipes)}</div>
			<div data-testid="error">{recipesError || "none"}</div>
			<button onClick={refreshRecipes}>Refresh</button>
		</>
	);
};

describe("RecipeProvider compatibility context", () => {
	const invalidateQueries = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries });
		vi.mocked(useAllRecipesQuery).mockReturnValue({
			data: [{ recipe_id: 1 }],
			isLoading: false,
			error: null,
		});
	});
	afterEach(() => cleanup());

	it("exposes query data and preserves refresh invalidation compatibility", async () => {
		render(
			<RecipeProvider>
				<Consumer />
			</RecipeProvider>
		);

		expect(screen.getByTestId("recipe-count")).toHaveTextContent("1");
		expect(screen.getByTestId("loading")).toHaveTextContent("false");
		expect(screen.getByTestId("error")).toHaveTextContent("none");

		await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["recipes", "list"],
		});
	});

	it("uses the generic fallback when the API error has no message", () => {
		vi.mocked(useAllRecipesQuery).mockReturnValue({
			data: undefined,
			isLoading: false,
			error: {
				message: "Raw Axios error details",
				response: { data: {} },
			},
		});

		render(
			<RecipeProvider>
				<Consumer />
			</RecipeProvider>
		);

		expect(screen.getByTestId("error")).toHaveTextContent(
			"Unable to load recipes from the server."
		);
		expect(screen.getByTestId("error")).not.toHaveTextContent(
			"Raw Axios error details"
		);
	});
});
