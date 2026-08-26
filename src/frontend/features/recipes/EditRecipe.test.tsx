// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import EditRecipe from "./EditRecipe";
import { loadOwnedRecipe, type RecipeEditorValue } from "./editRecipeApi";
import type { RecipeEditorProps } from "./RecipeEditor";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

vi.mock("./editRecipeApi", () => ({
	OWNED_RECIPE_NOT_FOUND: "OWNED_RECIPE_NOT_FOUND",
	loadOwnedRecipe: vi.fn(),
}));

vi.mock("./RecipeEditor", () => ({
	default: ({ onSaved, initialRecipe }: RecipeEditorProps) => (
		<button type="button" onClick={() => onSaved?.({ recipe: { recipe_id: 42, status: initialRecipe?.status || "published" }, mode: "edit" })}>
			Mock save
		</button>
	),
}));

const createOwnedRecipe = (status: NonNullable<RecipeEditorValue["status"]>): RecipeEditorValue => ({
	recipe_id: 42,
	recipe_name: "Tomato pasta",
	recipe_description: "A quick pasta dinner.",
	date_added: null,
	image_url: null,
	prep_time_minutes: 15,
	cook_time_minutes: 20,
	total_time_minutes: 35,
	user_id: 42,
	ingredients: ["Tomatoes"],
	instructions: ["Simmer and serve."],
	status,
});

const renderPage = () => render(
	<MemoryRouter initialEntries={["/food/edit?id=42"]}>
		<EditRecipe />
	</MemoryRouter>
);

describe("EditRecipe lifecycle navigation", () => {
	beforeEach(() => {
		cleanup();
	vi.clearAllMocks();
		vi.mocked(axios.post).mockResolvedValue({ data: { recipe: { recipe_id: 42, status: "draft" } } });
	});

	it("navigates published saves to the public detail route", async () => {
		vi.mocked(loadOwnedRecipe).mockResolvedValue(createOwnedRecipe("published"));
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Mock save" }));

		expect(mocks.navigate).toHaveBeenCalledWith("/recipe?id=42");
	});

	it("navigates draft saves back to the owner profile", async () => {
		vi.mocked(loadOwnedRecipe).mockResolvedValue(createOwnedRecipe("draft"));
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Mock save" }));

		expect(mocks.navigate).toHaveBeenCalledWith("/profile");
	});

	it("restores an archived recipe before rendering the editor", async () => {
		vi.mocked(loadOwnedRecipe)
			.mockResolvedValueOnce(createOwnedRecipe("archived"))
			.mockResolvedValueOnce(createOwnedRecipe("draft"));
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Restore recipe" }));

		await waitFor(() => expect(vi.mocked(axios.post)).toHaveBeenCalledWith("/recipes/42/restore"));
		expect(await screen.findByRole("button", { name: "Mock save" })).toBeInTheDocument();
	});
});
