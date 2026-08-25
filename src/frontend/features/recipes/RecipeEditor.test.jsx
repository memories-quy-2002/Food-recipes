// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import axios from "@/shared/api/axios";
import RecipeEditor from "./RecipeEditor";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn().mockResolvedValue({ data: { categories: [], meals: [] } }),
		post: vi.fn(),
		patch: vi.fn(),
		put: vi.fn(),
	},
}));

vi.mock("@/shared/api/supabaseStorage", () => ({
	isSupabaseStorageConfigured: () => false,
	uploadRecipeImage: vi.fn(),
}));

const fixtureRecipe = {
	recipe_id: 42,
	recipe_name: "Tomato pasta",
	recipe_description: "A quick pasta dinner.",
	category_name: "Dinner",
	meal_name: "Main course",
	prep_time_minutes: 15,
	cook_time_minutes: 20,
	ingredients: ["Tomatoes"],
	instructions: ["Simmer and serve."],
};

const renderEditor = (props) => render(
	<MemoryRouter>
		<AuthContext.Provider value={{ auth: { current: { userId: "editor-user" } } }}>
			<RecipeContext.Provider value={{ refreshRecipes: vi.fn() }}>
				<RecipeEditor onSaved={vi.fn()} {...props} />
			</RecipeContext.Provider>
		</AuthContext.Provider>
	</MemoryRouter>
);

describe("RecipeEditor", () => {
	beforeEach(() => {
		cleanup();
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("renders create mode without an edit identifier", () => {
		renderEditor({ mode: "create" });

		expect(screen.getByRole("heading", { name: /create a new recipe/i })).toBeInTheDocument();
	});

	it("hydrates edit mode from an owner recipe without using the create draft", async () => {
		localStorage.setItem(
			"food-recipes:recipe-draft:user:editor-user",
			JSON.stringify({
				version: 2,
				userId: "editor-user",
				savedAt: 1,
				form: {
					recipeName: "Unrelated create draft",
					recipeCategoryName: "Dinner",
					recipeMealName: "Main course",
					recipeDescription: "This should not hydrate an edit form.",
					recipeIngredients: ["Pasta"],
					recipeInstructions: ["Cook"],
					recipePrepTime: { number: 10, unit: "minutes" },
					recipeCookTime: { number: 10, unit: "minutes" },
				},
			})
		);

		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: fixtureRecipe });

		await waitFor(() => {
			expect(screen.getByLabelText(/recipe name/i)).toHaveValue("Tomato pasta");
		});
		expect(screen.queryByText("Restore your saved draft?")).not.toBeInTheDocument();
		expect(localStorage.getItem("food-recipes:recipe-draft:user:editor-user")).toContain("Unrelated create draft");
		expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
		expect(axios.post).not.toHaveBeenCalled();
		expect(axios.patch).not.toHaveBeenCalled();
		expect(axios.put).not.toHaveBeenCalled();
	});
});
