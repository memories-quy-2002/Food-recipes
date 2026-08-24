// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecipePicker from "./RecipePicker";

const mockQueries = vi.hoisted(() => ({
	savedIds: [1],
	allRecipes: [
		{ recipe_id: 1, recipe_name: "Saved Tomato Soup" },
	],
}));

vi.mock("../api/planningQueries", () => ({
	useSavedRecipeIdsQuery: () => ({ data: mockQueries.savedIds, isPending: false }),
}));

vi.mock("@/features/recipes/api/useRecipeQueries", () => ({
	useAllRecipesQuery: () => ({ data: mockQueries.allRecipes, isPending: false }),
}));

vi.mock("@/features/food/api/useRecipesQuery", () => ({
	useRecipesQuery: (state: { q: string }) => ({
		data: state.q === "ch" ? { recipes: [{ recipe_id: 2, recipe_name: "Chicken Curry" }] } : undefined,
		isPending: false,
	}),
}));

describe("RecipePicker", () => {
	beforeEach(() => vi.useRealTimers());
	afterEach(cleanup);

	it("shows saved recipes before discovery search", () => {
		render(<RecipePicker selectedRecipeId={null} onSelect={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Saved Tomato Soup" })).toBeTruthy();
	});

	it("debounces discovery search and requires two characters", async () => {
		vi.useFakeTimers();
		render(<RecipePicker selectedRecipeId={null} onSelect={vi.fn()} />);

		fireEvent.change(screen.getByRole("searchbox", { name: "Search recipes" }), {
			target: { value: "c" },
		});
		await act(async () => vi.advanceTimersByTime(250));
		expect(screen.queryByRole("button", { name: "Chicken Curry" })).toBeNull();

		fireEvent.change(screen.getByRole("searchbox", { name: "Search recipes" }), {
			target: { value: "ch" },
		});
		await act(async () => vi.advanceTimersByTime(250));
		expect(screen.getByRole("button", { name: "Chicken Curry" })).toBeTruthy();
	});
});
