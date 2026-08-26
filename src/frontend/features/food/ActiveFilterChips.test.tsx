// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActiveFilterChips from "./ActiveFilterChips";

const queryState = { q: "chicken", categoryId: "2", mealId: "3", sort: "popular", filter: "", page: 1, limit: 6 } as const;
const categories = [{ id: 2, name: "Main Course" }];
const meals = [{ id: 3, name: "Dinner" }];

describe("ActiveFilterChips", () => {
	afterEach(cleanup);

	it("shows human-readable active filters and removes one through URL state", () => {
		const onQueryStateChange = vi.fn();
		render(
			<ActiveFilterChips
				queryState={queryState}
				categories={categories}
				meals={meals}
				onQueryStateChange={onQueryStateChange}
				onClearFilters={vi.fn()}
			/>,
		);

		expect(screen.getByText("Search: chicken")).toBeTruthy();
		expect(screen.getByText("Main Course")).toBeTruthy();
		expect(screen.getByText("Dinner")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Remove search filter" }));
		expect(onQueryStateChange).toHaveBeenCalledWith({ q: "", page: 1 });
	});

	it("clears all active filters", () => {
		const onClearFilters = vi.fn();
		render(
			<ActiveFilterChips
				queryState={queryState}
				categories={categories}
				meals={meals}
				onQueryStateChange={vi.fn()}
				onClearFilters={onClearFilters}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onClearFilters).toHaveBeenCalledOnce();
	});
});
