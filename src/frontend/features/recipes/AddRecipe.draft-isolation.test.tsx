// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AddRecipe from "./AddRecipe";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import type { AuthState } from "@/app/AuthProvider";
import type { RecipeContextValue } from "@/app/RecipeProvider";
import { loadRecipeDraft } from "./recipeDraftStorage";

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

const renderForUser = (userId: number, rerender: RenderResult["rerender"]): void =>
	rerender(
		<MemoryRouter>
			<AuthContext.Provider value={{ auth: { current: {
				isAuthenticated: true,
				hydrated: true,
				user: null,
				userId,
				token: null,
			} satisfies AuthState } }}>
				<RecipeContext.Provider value={{
					recipes: [],
				isLoadingRecipes: false,
				recipesError: null,
				refreshRecipes: vi.fn().mockResolvedValue(undefined),
			} satisfies RecipeContextValue}>
					<AddRecipe />
				</RecipeContext.Provider>
			</AuthContext.Provider>
		</MemoryRouter>
	);

describe("recipe draft account isolation", () => {
	beforeEach(() => {
		cleanup();
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("clears an old restore candidate when switching to an account without a draft", async () => {
		localStorage.setItem(
					"food-recipes:recipe-draft:user:101",
			JSON.stringify({
				version: 1,
				userId: "101",
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
		renderForUser(101, view.rerender);
		await screen.findByText("Restore draft");

		renderForUser(202, view.rerender);

		await waitFor(() => {
			expect(screen.queryByText("Restore draft")).not.toBeInTheDocument();
		});
		expect(localStorage.getItem("food-recipes:recipe-draft:user:202")).toBeNull();
		expect(localStorage.getItem("food-recipes:recipe-draft:user:101")).not.toBeNull();
	});

	it("restores the selected account draft through the form reset boundary", async () => {
		localStorage.setItem(
			"food-recipes:recipe-draft:user:303",
			JSON.stringify({
				version: 1,
				userId: "303",
				savedAt: 1000,
				form: {
					recipeName: "Private soup draft",
					recipeCategoryName: "Dinner",
					recipeMealName: "Main course",
					recipeDescription: "Keep this draft private.",
					recipeIngredients: ["water"],
					recipeInstructions: ["Boil"],
					recipePrepTime: { number: 10, unit: "minutes" },
					recipeCookTime: { number: 20, unit: "minutes" },
				},
			})
		);

		const view = render(<div />);
		renderForUser(303, view.rerender);
		await userEvent.click(await screen.findByRole("button", { name: "Restore draft" }));

		expect(screen.getByDisplayValue("Private soup draft")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Boil")).toBeInTheDocument();
		expect(screen.getByText("Older draft notes preserved")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
		expect(loadRecipeDraft(localStorage, 303)?.form.recipeIngredients).toEqual(["water"]);
		expect(screen.queryByText("Restore your saved draft?")).not.toBeInTheDocument();
	});

	it("persists an edited duration through the RHF field path", async () => {
		const user = userEvent.setup();
		const view = render(<div />);
		renderForUser(404, view.rerender);

		const preparationTime = await screen.findByLabelText("Amount", { selector: "#formRecipePrepTimeNumber" });
		await user.clear(preparationTime);
		await user.type(preparationTime, "45");
		await user.click(screen.getByRole("button", { name: "Save draft" }));

		const storedDraft = loadRecipeDraft(localStorage, 404);
		expect(storedDraft?.form.recipePrepTime).toEqual({ number: "45", unit: "minutes" });
	});

	it("does not use Tailwind's blur utility class for the recipe editor", async () => {
		const view = render(<div />);
		renderForUser(505, view.rerender);

		await screen.findByRole("heading", { name: "Create a new recipe" });
		expect(document.querySelector(".add__surface")).toBeInTheDocument();
		expect(document.querySelector(".add.blur")).not.toBeInTheDocument();
	});
});
