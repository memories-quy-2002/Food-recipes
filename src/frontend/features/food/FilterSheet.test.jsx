// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FilterSheet from "./FilterSheet";

const categories = [{ id: 2, name: "Main Course" }];
const meals = [{ id: 3, name: "Dinner" }];
const queryState = { q: "", categoryId: "", mealId: "", sort: "popular", page: 1, limit: 6 };

const renderSheet = (overrides = {}) => render(
	<FilterSheet
		open
		queryState={queryState}
		categories={categories}
		meals={meals}
		onQueryStateChange={vi.fn()}
		onClearFilters={vi.fn()}
		onClose={vi.fn()}
		{...overrides}
	/>,
);

describe("FilterSheet", () => {
	afterEach(cleanup);

	it("renders a labelled mobile filter dialog and closes on Escape", () => {
		const onClose = vi.fn();
		renderSheet({ onClose });

		expect(screen.getByRole("dialog", { name: "Filter recipes" })).toBeTruthy();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("updates the URL-driven state when a category is selected", () => {
		const onQueryStateChange = vi.fn();
		renderSheet({ onQueryStateChange });

		fireEvent.click(screen.getByRole("button", { name: "Main Course" }));
		expect(onQueryStateChange).toHaveBeenCalledWith({ categoryId: "2", page: 1 });
	});

	it("clears every active filter through the existing callback", () => {
		const onClearFilters = vi.fn();
		renderSheet({ onClearFilters, queryState: { ...queryState, q: "chicken" } });

		fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onClearFilters).toHaveBeenCalledOnce();
	});
});
