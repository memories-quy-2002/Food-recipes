// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { PrepareRecipeResponse } from "./api/shoppingApi";
import PreparationSummary from "./PreparationSummary";

const preview: PrepareRecipeResponse = {
	recipe_id: 12,
	recipe_name: "Soup",
	servings: 4,
	added_shopping_items: 0,
	ingredients: [
		{ position: 0, ingredient_name: "Carrot", required_quantity: 3, required_unit: "piece", available_quantity: 1, missing_quantity: 2, pantry_id: 1, status: "missing" },
		{ position: 1, ingredient_name: "Stock", required_quantity: 500, required_unit: "ml", available_quantity: 0, missing_quantity: 500, pantry_id: null, status: "missing" },
		{ position: 2, ingredient_name: "Salt", required_quantity: null, required_unit: null, available_quantity: null, missing_quantity: null, pantry_id: null, status: "needs_details" },
	],
};

describe("PreparationSummary", () => {
	afterEach(cleanup);

	it("shows missing names and scaled quantities before asking to add them", () => {
		render(<MemoryRouter><PreparationSummary result={preview} onAddMissing={() => undefined} /></MemoryRouter>);

		expect(screen.getByRole("list", { name: "Ingredient amounts and details" })).toHaveTextContent("Carrot");
		expect(screen.getByText("2 piece")).toBeInTheDocument();
		expect(screen.getByText("Stock")).toBeInTheDocument();
		expect(screen.getByText("500 ml")).toBeInTheDocument();
		expect(screen.getByText("Needs a quantity")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add missing ingredients to shopping list" })).toBeInTheDocument();
	});

	it("requires a fresh preview when servings change", () => {
		const onPreviewServings = vi.fn();
		render(<MemoryRouter><PreparationSummary result={preview} onAddMissing={() => undefined} onPreviewServings={onPreviewServings} /></MemoryRouter>);

		fireEvent.change(screen.getByRole("spinbutton", { name: "Servings" }), { target: { value: "6" } });
		expect(screen.getByRole("button", { name: "Add missing ingredients to shopping list" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Update preview for 6 servings" }));
		expect(onPreviewServings).toHaveBeenCalledWith(6);
	});
});
