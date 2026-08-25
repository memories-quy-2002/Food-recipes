// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import axios from "@/shared/api/axios";
import RecipeEditor from "./RecipeEditor";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		patch: vi.fn(),
		put: vi.fn(),
	},
}));

vi.mock("@/shared/api/supabaseStorage", () => ({
	isSupabaseStorageConfigured: () => false,
	uploadRecipeImage: vi.fn(),
}));

const recipe = {
	recipe_id: 42,
	status: "published",
	recipe_name: "Tomato pasta",
	recipe_description: "A quick pasta dinner.",
	category_name: "Dinner",
	meal_name: "Main course",
	prep_time_minutes: 15,
	cook_time_minutes: 20,
	ingredients: ["Tomatoes"],
	instructions: ["Simmer and serve."],
};

const renderEditor = () => render(
	<MemoryRouter>
		<AuthContext.Provider value={{ auth: { current: { userId: "editor-user" } } }}>
			<RecipeContext.Provider value={{ refreshRecipes: vi.fn() }}>
				<RecipeEditor mode="edit" recipeId={42} initialRecipe={recipe} onSaved={vi.fn()} />
			</RecipeContext.Provider>
		</AuthContext.Provider>
	</MemoryRouter>
);

describe("RecipeEditor edit accessibility", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		axios.get.mockImplementation((route) => {
			if (route === "/categories") return Promise.resolve({ data: { categories: [{ id: 1, name: "Dinner" }] } });
			if (route === "/meals") return Promise.resolve({ data: { meals: [{ id: 2, name: "Main course" }] } });
			return Promise.resolve({ data: { recipe } });
		});
		axios.patch.mockResolvedValue({ data: {} });
		axios.put.mockResolvedValue({ data: {} });
	});

	it("keeps the published save action keyboard-operable", async () => {
		const user = userEvent.setup();
		renderEditor();

		fireEvent.change(await screen.findByLabelText(/recipe name/i), { target: { value: "Better tomato pasta" } });
		const saveButton = screen.getByRole("button", { name: "Save changes" });
		saveButton.focus();
		await user.keyboard("{Enter}");

		await waitFor(() => expect(axios.patch).toHaveBeenCalled());
	});
});
