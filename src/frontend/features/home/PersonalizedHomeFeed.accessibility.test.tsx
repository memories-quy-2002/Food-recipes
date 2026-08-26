// @vitest-environment jsdom
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("./api/useHomeFeedQuery", () => ({
	useHomeFeedQuery: vi.fn(() => ({
		data: {
			personalized: true,
			sections: [{
				key: "pantry",
				title: "From your pantry",
				description: "Recipes using ingredients you have.",
				recipes: [{
					recipe_id: 7,
					recipe_name: "Pantry pasta",
					recipe_description: null,
					prep_time_minutes: 10,
					cook_time_minutes: 15,
					total_time_minutes: 25,
					date_added: null,
					image_url: null,
					user_id: 1,
					meal_id: 1,
					meal_name: "Dinner",
					category_id: 1,
					category_name: "Pasta",
					overall_score: 4.5,
					num_ratings: 4,
					dietary_tags: [],
				}],
			}],
		},
		isLoading: false,
		isError: false,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/shared/ui/RecipeCard", () => ({
	default: ({ recipe }: { recipe: { recipe_name: ReactNode } }) => <article>{recipe.recipe_name}</article>,
}));

import PersonalizedHomeFeed from "./PersonalizedHomeFeed";

describe("PersonalizedHomeFeed accessibility", () => {
	it("exposes a labelled section and a keyboard-focusable pantry link", () => {
		render(<MemoryRouter><PersonalizedHomeFeed isAuthenticated wishlist={[]} onClickFavorite={vi.fn()} /></MemoryRouter>);

		expect(screen.getByRole("region", { name: "From your pantry" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Update your pantry" })).toHaveAttribute("href", "/pantry");
		expect(screen.getByText("Pantry pasta")).toBeInTheDocument();
	});
});
