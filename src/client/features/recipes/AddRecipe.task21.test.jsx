// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
		cleanup();
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

	it("restores the selected account draft through the form reset boundary", async () => {
		localStorage.setItem(
			"food-recipes:recipe-draft:user:restore-user",
			JSON.stringify({
				version: 1,
				userId: "restore-user",
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
		renderForUser("restore-user", view.rerender);
		await userEvent.click(await screen.findByRole("button", { name: "Restore draft" }));

		expect(screen.getByDisplayValue("Private soup draft")).toBeInTheDocument();
		expect(screen.getByDisplayValue("water")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Boil")).toBeInTheDocument();
		expect(screen.queryByText("Restore your saved draft?")).not.toBeInTheDocument();
	});

	it("persists an edited duration through the RHF field path", async () => {
		const user = userEvent.setup();
		const view = render(<div />);
		renderForUser("duration-user", view.rerender);

		const preparationTime = await screen.findByLabelText("Preparation Time");
		await user.clear(preparationTime);
		await user.type(preparationTime, "45");
		await user.click(screen.getByRole("button", { name: "Save draft" }));

		const storedDraft = JSON.parse(
			localStorage.getItem("food-recipes:recipe-draft:user:duration-user")
		);
		expect(storedDraft.form.recipePrepTime).toEqual({ number: "45", unit: "minutes" });
	});
});
