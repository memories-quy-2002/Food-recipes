// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import type { AuthState } from "@/app/AuthProvider";
import type { RecipeStatus } from "@/shared/api/contracts";
import axios from "@/shared/api/axios";
import { queryClient } from "@/shared/api/queryClient";
import { recipeQueryKeys } from "@/features/recipes/api/useRecipeQueries";
import RecipeEditor, { normalizeStructuredIngredients, type RecipeEditorInput, type RecipeEditorProps } from "./RecipeEditor";

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

const fixtureRecipe: RecipeEditorInput = {
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

const savedRecipe = {
	...fixtureRecipe,
	status: "draft",
	structured_ingredients: [{
		quantity: null,
		quantity_text: "1/2",
		unit: "CUP",
		original_text: "1/2 cup tomatoes",
		name: "Tomatoes",
	}],
} satisfies RecipeEditorInput & { status: RecipeStatus };

const expectedEditBasePayload = {
	name: "Tomato pasta",
	description: "A quick pasta dinner.",
	mealId: 2,
	categoryId: 1,
	prepTimeMinutes: 15,
	cookTimeMinutes: 20,
	imageUrl: null,
	ingredients: ["Tomatoes"],
	instructions: ["Simmer and serve."],
};

const expectedEditIngredientsPayload = {
	ingredients: [{
		position: 0,
		quantity: null,
		quantityText: null,
		unit: null,
		name: "Tomatoes",
		preparation: null,
		originalText: null,
	}],
};

const expectedEditNutritionPayload = {
	servings: null,
	calories: null,
	protein: null,
	carbohydrates: null,
	fat: null,
	fiber: null,
	sugar: null,
	sodium: null,
};

const expectedEditTagsPayload = { dietaryTags: [], allergenTags: [] };

const expectEditPayloadRequests = (): void => {
	expect(axios.patch).toHaveBeenCalledWith("/recipes/42", expectedEditBasePayload);
	expect(axios.put).toHaveBeenNthCalledWith(1, "/recipes/42/ingredients", expectedEditIngredientsPayload);
	expect(axios.put).toHaveBeenNthCalledWith(2, "/recipes/42/nutrition", expectedEditNutritionPayload);
	expect(axios.put).toHaveBeenNthCalledWith(3, "/recipes/42/dietary-tags", expectedEditTagsPayload);
};

const renderEditor = (props: RecipeEditorProps): RenderResult => render(
	<MemoryRouter>
		<AuthContext.Provider value={{ auth: { current: {
			isAuthenticated: true,
			hydrated: true,
			user: null,
			userId: 42,
			token: null,
		} satisfies AuthState } }}>
			<RecipeEditor onSaved={vi.fn()} {...props} />
		</AuthContext.Provider>
	</MemoryRouter>
);

describe("RecipeEditor", () => {
	beforeEach(() => {
		cleanup();
		localStorage.clear();
		vi.clearAllMocks();
		vi.mocked(axios.get).mockImplementation((route: string) => {
			if (route === "/categories") return Promise.resolve({ data: { categories: [{ id: 1, name: "Dinner" }] } });
			if (route === "/meals") return Promise.resolve({ data: { meals: [{ id: 2, name: "Main course" }] } });
			return Promise.resolve({ data: { recipe: { ...fixtureRecipe, status: "published" } } });
		});
		vi.mocked(axios.patch).mockResolvedValue({ data: { recipe: savedRecipe } });
		vi.mocked(axios.put).mockResolvedValue({ data: { recipe: savedRecipe } });
		vi.mocked(axios.post).mockResolvedValue({ data: { recipe: { ...savedRecipe, status: "published" } } });
	});

	it("renders create mode without an edit identifier", () => {
		renderEditor({ mode: "create" });

		expect(screen.getByRole("heading", { name: /create a new recipe/i })).toBeInTheDocument();
	});

	it("normalizes a blank legacy quantity to null", () => {
		expect(normalizeStructuredIngredients([{
		quantity: "",
		name: "Tomatoes",
	}])).toEqual([{
		position: 0,
		quantity: null,
		quantityText: null,
		unit: null,
		name: "Tomatoes",
		preparation: null,
		originalText: null,
	}]);
	});

	it("normalizes non-finite legacy quantities to null", () => {
		expect(normalizeStructuredIngredients([
			{ quantity: Number.NaN, name: "Tomatoes" },
			{ quantity: Number.POSITIVE_INFINITY, name: "Basil" },
		])).toEqual([
			{
				position: 0,
				quantity: null,
				quantityText: null,
				unit: null,
				name: "Tomatoes",
				preparation: null,
				originalText: null,
			},
			{
				position: 1,
				quantity: null,
				quantityText: null,
				unit: null,
				name: "Basil",
				preparation: null,
				originalText: null,
			},
		]);
	});

	it("hydrates edit mode from an owner recipe without using the create draft", async () => {
		localStorage.setItem(
			"food-recipes:recipe-draft:user:42",
			JSON.stringify({
				version: 2,
				userId: "42",
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
		expect(localStorage.getItem("food-recipes:recipe-draft:user:42")).toContain("Unrelated create draft");
		expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
		expect(axios.post).not.toHaveBeenCalled();
		expect(axios.patch).not.toHaveBeenCalled();
		expect(axios.put).not.toHaveBeenCalled();
	});

	it("uses lifecycle-aware edit actions", async () => {
		const { rerender } = renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "published" } });

		expect(await screen.findByRole("button", { name: "Save changes" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();

		rerender(
			<MemoryRouter>
				<AuthContext.Provider value={{ auth: { current: {
					isAuthenticated: true,
					hydrated: true,
					user: null,
					userId: 42,
					token: null,
				} satisfies AuthState } }}>
					<RecipeEditor mode="edit" recipeId={42} initialRecipe={{ ...fixtureRecipe, status: "draft" }} onSaved={vi.fn()} />
				</AuthContext.Provider>
			</MemoryRouter>
		);

		expect(await screen.findByRole("button", { name: "Save draft" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
	});

	it("keeps field validation in front of an edit save", async () => {
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "published" } });

		fireEvent.change(await screen.findByLabelText(/recipe name/i), { target: { value: "" } });
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Recipe name is required."));
		expect(axios.patch).not.toHaveBeenCalled();
	});

	it("keeps the form available for retry and identifies a failed metadata section", async () => {
		const onSaved = vi.fn();
		vi.mocked(axios.put)
			.mockResolvedValueOnce({ data: { recipe: savedRecipe } })
			.mockRejectedValueOnce(new Error("nutrition unavailable"))
			.mockResolvedValue({ data: { recipe: savedRecipe } });
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "published" }, onSaved });

		const name = await screen.findByLabelText(/recipe name/i);
		fireEvent.change(name, { target: { value: "Better tomato pasta" } });
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Nutrition could not be saved: nutrition unavailable/i));
		expect(name).toHaveValue("Better tomato pasta");

		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		await waitFor(() => expect(onSaved).toHaveBeenCalled());
	});

	it("saves an edited draft without publishing it", async () => {
		const onSaved = vi.fn();
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "draft" }, onSaved });

		fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));

		await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
			recipe: expect.objectContaining({ status: "draft" }),
		})));
		expect(axios.post).not.toHaveBeenCalled();
		expectEditPayloadRequests();
	});

	it("saves a draft before publishing and navigates with the published response", async () => {
		const onSaved = vi.fn();
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "draft" }, onSaved });

		fireEvent.click(await screen.findByRole("button", { name: "Publish" }));

		await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
			recipe: expect.objectContaining({ status: "published" }),
		})));
		expectEditPayloadRequests();
		expect(axios.post).toHaveBeenCalledWith("/recipes/42/publish");
		expect(vi.mocked(axios.patch).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(axios.post).mock.invocationCallOrder[0]);
	});

	it("prevents a double submit while an edit save is in flight", async () => {
		const onSaved = vi.fn();
		let resolvePatch: ((value: unknown) => void) | undefined;
		vi.mocked(axios.patch).mockImplementationOnce(() => new Promise((resolve) => {
			resolvePatch = resolve;
		}));
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "published" }, onSaved });

		const saveButton = await screen.findByRole("button", { name: "Save changes" });
		fireEvent.change(screen.getByLabelText(/recipe name/i), { target: { value: "Better tomato pasta" } });
		fireEvent.click(saveButton);
		fireEvent.click(saveButton);
		await waitFor(() => expect(axios.patch).toHaveBeenCalledTimes(1));

		if (!resolvePatch) throw new Error("The patch request was not created.");
		resolvePatch({ data: { recipe: { ...savedRecipe, status: "published" } } });
		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
	});

	it("refreshes owner and detail queries before reporting an edit save", async () => {
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
		const onSaved = vi.fn();
		renderEditor({ mode: "edit", recipeId: 42, initialRecipe: { ...fixtureRecipe, status: "published" }, onSaved });

		fireEvent.change(await screen.findByLabelText(/recipe name/i), { target: { value: "Better tomato pasta" } });
		fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));

		await waitFor(() => expect(onSaved).toHaveBeenCalled());
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: recipeQueryKeys.list() });
		invalidateQueries.mockRestore();
	});
});
