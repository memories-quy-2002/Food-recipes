// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getWeekRange } from "../api/planningDates";
import type { MealPlanItem } from "../api/planningApi";
import MealPlanGrid from "./MealPlanGrid";

const range = getWeekRange(new Date("2026-08-26T12:00:00Z"));

const plannedDinner: MealPlanItem = {
	item_id: 4,
	plan_id: 12,
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	planned_date: "2026-08-24",
	slot: "dinner",
	servings: 4,
	created_at: "2026-08-24T00:00:00.000Z",
};

const props = {
	days: range.days,
	items: [] as MealPlanItem[],
	onAdd: vi.fn(),
	onEdit: vi.fn(),
	onRemove: vi.fn(),
	onOpenRecipe: vi.fn(),
};

describe("MealPlanGrid", () => {
	it("renders every day and slot with keyboard-accessible add actions", () => {
		render(
			<MemoryRouter>
				<MealPlanGrid {...props} />
			</MemoryRouter>,
		);

		expect(screen.getByRole("heading", { name: "Monday" })).toBeTruthy();
		expect(screen.getAllByRole("button", { name: /Add recipe to/ })).toHaveLength(28);
	});

	it("renders a planned recipe with explicit actions", () => {
		render(
			<MemoryRouter>
				<MealPlanGrid {...props} items={[plannedDinner]} />
			</MemoryRouter>,
		);

		expect(screen.getByRole("link", { name: "Open Chicken Curry" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Start cooking Chicken Curry" }).getAttribute("href")).toBe(
			"/recipe/cooking?id=7&planItemId=4&date=2026-08-24&slot=dinner&servings=4&returnTo=%2Fplanning",
		);
		expect(screen.getByRole("button", { name: "Change Chicken Curry" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Remove Chicken Curry from dinner" })).toBeTruthy();
		expect(screen.getByText("4 servings")).toBeTruthy();
	});
});
