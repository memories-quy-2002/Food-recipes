// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CollectionRecipeDialog from "./CollectionRecipeDialog";

const collections = [
	{ collection_id: 4, name: "Weeknight dinners", recipe_count: 2 },
	{ collection_id: 9, name: "Weekend baking", recipe_count: 1 },
];

describe("CollectionRecipeDialog", () => {
	afterEach(cleanup);

	it("adds a recipe to the selected collection", () => {
		const onAdd = vi.fn();
		render(
			<CollectionRecipeDialog
				open
				recipeName="Chicken Curry"
				collections={collections}
				onAdd={onAdd}
				onClose={vi.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Save to Weeknight dinners" }),
		);
		expect(onAdd).toHaveBeenCalledWith(4);
	});

	it("communicates loading and API errors accessibly", () => {
		render(
			<CollectionRecipeDialog
				open
				recipeName="Chicken Curry"
				collections={[]}
				isLoading
				errorMessage="Unable to load your collections."
				onAdd={vi.fn()}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText("Loading your collections…")).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Unable to load your collections.",
		);
	});
});
