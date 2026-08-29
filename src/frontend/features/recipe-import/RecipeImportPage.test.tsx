// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeImportPage from "./RecipeImportPage";

const api = vi.hoisted(() => ({ preview: vi.fn(), save: vi.fn() }));
vi.mock("./api/recipeImportApi", () => ({
	previewRecipeImport: api.preview,
	saveImportedRecipeDraft: api.save,
}));

describe("RecipeImportPage", () => {
	beforeEach(() => {
		api.preview.mockResolvedValue({ sourceUrl: "https://example.com/pasta", name: "Imported Pasta", ingredients: ["pasta"], instructions: ["Boil"] });
		api.save.mockResolvedValue({ recipe: { recipe_id: 7, status: "draft" } });
	});
	afterEach(() => { cleanup(); vi.clearAllMocks(); });

	it("rejects invalid URLs before making a request", async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><RecipeImportPage /></MemoryRouter>);
		await user.type(screen.getByLabelText("Recipe URL"), "javascript:alert(1)");
		await user.click(screen.getByRole("button", { name: "Preview recipe" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("valid http(s)");
		expect(api.preview).not.toHaveBeenCalled();
	});

	it("shows an editable preview and saves it as a draft", async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><RecipeImportPage /></MemoryRouter>);
		await user.type(screen.getByLabelText("Recipe URL"), "https://example.com/pasta");
		await user.click(screen.getByRole("button", { name: "Preview recipe" }));
		const name = await screen.findByLabelText("Name");
		await user.clear(name);
		await user.type(name, "Edited Pasta");
		await user.click(screen.getByRole("button", { name: "Save draft" }));
		expect(api.save).toHaveBeenCalledWith(expect.objectContaining({ name: "Edited Pasta", sourceUrl: "https://example.com/pasta" }));
	});

	it("keeps the editable preview when save fails", async () => {
		const user = userEvent.setup();
		api.save.mockRejectedValue(new Error("offline"));
		render(<MemoryRouter><RecipeImportPage /></MemoryRouter>);
		await user.type(screen.getByLabelText("Recipe URL"), "https://example.com/pasta");
		await user.click(screen.getByRole("button", { name: "Preview recipe" }));
		await screen.findByLabelText("Name");
		await user.click(screen.getByRole("button", { name: "Save draft" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("edits are still here");
		expect(screen.getByDisplayValue("Imported Pasta")).toBeInTheDocument();
	});
});
