// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import RecipeMetadataPanel from "./RecipeMetadataPanel";

describe("RecipeMetadataPanel", () => {
	afterEach(() => cleanup());

	it("shows nutrition, allergens, provenance, and the estimated-data warning", () => {
		render(
			<RecipeMetadataPanel
				metadata={{
					nutrition: {
						calories_per_serving: 420,
						protein_grams: 28,
						carbohydrates_grams: null,
						fat_grams: null,
						fiber_grams: null,
						sugar_grams: null,
						sodium_milligrams: null,
						source: "estimated",
						source_reference: null,
					},
					allergens: [{ name: "peanuts", source: "provided_by_author" }],
				}}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Nutrition and allergens" })).toBeInTheDocument();
		expect(screen.getByText(/420 kcal/)).toBeInTheDocument();
		expect(screen.getByText("Peanuts")).toBeInTheDocument();
		expect(screen.getByRole("note")).toHaveTextContent(/estimated/i);
	});

	it("does not claim a recipe is allergen-free when metadata is absent", () => {
		render(<RecipeMetadataPanel metadata={{ nutrition: null, allergens: [] }} />);

		expect(screen.getByText(/No nutrition or allergen metadata has been provided/i)).toBeInTheDocument();
		expect(screen.getByText(/does not guarantee that the recipe is allergen-free/i)).toBeInTheDocument();
	});

	it("warns when an allergen declaration is estimated", () => {
		render(<RecipeMetadataPanel metadata={{ nutrition: null, allergens: [{ name: "milk", source: "estimated" }] }} />);

		expect(screen.getByRole("note")).toHaveTextContent(/Estimated allergen information/i);
	});
});
