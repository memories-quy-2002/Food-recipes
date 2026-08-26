// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import SuggestionPanel from "./SuggestionPanel";

const mockSuggestion = vi.hoisted(() => ({
	mutate: vi.fn(),
	data: {
		intent: "ingredient_match",
		source: "catalog_rules",
		disclaimer: "Suggestions are advisory.",
		suggestions: [{
			recipe_id: 15,
			recipe_name: "Chicken Curry",
			recipe_description: "Warm spices",
			image_url: null,
			match_score: 1,
			reason: "Matches one supplied ingredient.",
		}],
	},
}));

vi.mock("./api/suggestionsQueries", () => ({
	useSuggestionMutation: () => ({
		mutate: mockSuggestion.mutate,
		data: mockSuggestion.data,
		isPending: false,
		isError: false,
		error: null,
	}),
}));

describe("SuggestionPanel", () => {
	afterEach(() => {
		cleanup();
		mockSuggestion.mutate.mockClear();
	});

	it("submits normalized ingredients and renders read-only recipe links", () => {
		render(
			<MemoryRouter>
				<SuggestionPanel mode="ingredient_match" />
			</MemoryRouter>,
		);

		fireEvent.change(screen.getByLabelText("Ingredients to search"), {
			target: { value: " chicken, onion " },
		});
		fireEvent.click(screen.getByRole("button", { name: "Find suggestions" }));

		expect(mockSuggestion.mutate).toHaveBeenCalledWith(
			{ intent: "ingredient_match", ingredients: ["chicken", "onion"] },
			expect.any(Object),
		);
		expect(screen.getByRole("link", { name: "Chicken Curry" })).toHaveAttribute("href", "/recipe?id=15");
		expect(screen.getByRole("status")).toHaveTextContent(/advisory/i);
	});

	it("uses the recipe ingredient field for substitution mode", () => {
		render(
			<MemoryRouter>
				<SuggestionPanel mode="substitution" recipeId={15} />
			</MemoryRouter>,
		);

		fireEvent.change(screen.getByLabelText("Ingredient to compare"), { target: { value: "milk" } });
		fireEvent.click(screen.getByRole("button", { name: "Find suggestions" }));

		expect(mockSuggestion.mutate).toHaveBeenCalledWith(
			{ intent: "substitution", recipeId: 15, ingredient: "milk" },
			expect.any(Object),
		);
	});
});
