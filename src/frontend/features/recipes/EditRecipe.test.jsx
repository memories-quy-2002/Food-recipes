// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import EditRecipe from "./EditRecipe";
import { loadOwnedRecipe } from "./editRecipeApi";

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
	default: ({ onSaved, initialRecipe }) => (
		<button type="button" onClick={() => onSaved({ recipe: { recipe_id: 42, status: initialRecipe?.status || "published" } })}>
			Mock save
		</button>
	),
}));

const renderPage = () => render(
	<MemoryRouter initialEntries={["/food/edit?id=42"]}>
		<EditRecipe />
	</MemoryRouter>
);

describe("EditRecipe lifecycle navigation", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		axios.post.mockResolvedValue({ data: { recipe: { recipe_id: 42, status: "draft" } } });
	});

	it("navigates published saves to the public detail route", async () => {
		loadOwnedRecipe.mockResolvedValue({ recipe_id: 42, status: "published" });
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Mock save" }));

		expect(mocks.navigate).toHaveBeenCalledWith("/recipe?id=42");
	});

	it("navigates draft saves back to the owner profile", async () => {
		loadOwnedRecipe.mockResolvedValue({ recipe_id: 42, status: "draft" });
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Mock save" }));

		expect(mocks.navigate).toHaveBeenCalledWith("/profile");
	});

	it("restores an archived recipe before rendering the editor", async () => {
		loadOwnedRecipe
			.mockResolvedValueOnce({ recipe_id: 42, status: "archived" })
			.mockResolvedValueOnce({ recipe_id: 42, status: "draft" });
		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Restore recipe" }));

		await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/recipes/42/restore"));
		expect(await screen.findByRole("button", { name: "Mock save" })).toBeInTheDocument();
	});
});
