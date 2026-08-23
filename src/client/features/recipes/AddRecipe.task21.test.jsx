// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AddRecipe from "./AddRecipe";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn().mockResolvedValue({ data: { categories: [], meals: [] } }),
		post: vi.fn(),
	},
}));

vi.mock("@/shared/api/supabaseStorage", () => ({
	isSupabaseStorageConfigured: () => false,
	uploadRecipeImage: vi.fn(),
}));

vi.mock("@/shared/seo/PageHelmet", () => ({ default: () => null }));

const renderForUser = (userId, rerender) =>
	rerender(
		<MemoryRouter>
			<AuthContext.Provider value={{ auth: { current: { userId } } }}>
				<RecipeContext.Provider value={{ refreshRecipes: vi.fn() }}>
					<AddRecipe />
				</RecipeContext.Provider>
			</AuthContext.Provider>
		</MemoryRouter>
	);

describe("recipe draft account isolation", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("clears an old restore candidate when switching to an account without a draft", async () => {
		localStorage.setItem(
			"food-recipes:recipe-draft:user:old-user",
			JSON.stringify({
				version: 1,
				userId: "old-user",
				savedAt: 1000,
				form: {
					recipeName: "Old user's private draft",
					recipeCategoryName: "",
					recipeMealName: "",
					recipeDescription: "",
					recipeIngredients: [""],
					recipeInstructions: [""],
					recipePrepTime: { number: 15, unit: "minutes" },
					recipeCookTime: { number: 30, unit: "minutes" },
				},
			})
		);

		const view = render(<div />);
		renderForUser("old-user", view.rerender);
		await screen.findByText("Restore draft");

		renderForUser("new-user", view.rerender);

		await waitFor(() => {
			expect(screen.queryByText("Restore draft")).not.toBeInTheDocument();
		});
		expect(localStorage.getItem("food-recipes:recipe-draft:user:new-user")).toBeNull();
		expect(localStorage.getItem("food-recipes:recipe-draft:user:old-user")).not.toBeNull();
	});
});
