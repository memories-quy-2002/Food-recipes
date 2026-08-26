// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RecipeProvider, { RecipeContext } from "./RecipeProvider";

const mockUseAllRecipesQuery = vi.hoisted(() => vi.fn());

vi.mock("@/features/recipes/api/useRecipeQueries", () => ({
	recipeQueryKeys: { list: () => ["recipes", "list"] },
	useAllRecipesQuery: mockUseAllRecipesQuery,
}));

const Consumer = (): React.ReactElement => {
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

const queryClient = new QueryClient();
const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

const renderProvider = (): void => {
	render(
		<QueryClientProvider client={queryClient}>
			<RecipeProvider>
				<Consumer />
			</RecipeProvider>
		</QueryClientProvider>,
	);
};

describe("RecipeProvider compatibility context", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAllRecipesQuery.mockReturnValue({
			data: [{ recipe_id: 1 }],
			isLoading: false,
			error: null,
		});
	});
	afterEach(() => cleanup());

	it("exposes query data and preserves refresh invalidation compatibility", async () => {
		renderProvider();

		expect(screen.getByTestId("recipe-count")).toHaveTextContent("1");
		expect(screen.getByTestId("loading")).toHaveTextContent("false");
		expect(screen.getByTestId("error")).toHaveTextContent("none");

		await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["recipes", "list"],
		});
	});

	it("uses the generic fallback when the API error has no message", () => {
		mockUseAllRecipesQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error("Raw Axios error details"),
		});

		renderProvider();

		expect(screen.getByTestId("error")).toHaveTextContent(
			"Unable to load recipes from the server."
		);
		expect(screen.getByTestId("error")).not.toHaveTextContent(
			"Raw Axios error details"
		);
	});
});
