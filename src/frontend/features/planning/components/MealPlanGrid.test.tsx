// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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
	afterEach(() => cleanup());

	it("keeps the seven-day calendar for wide screens", () => {
		render(
			<MemoryRouter>
				<MealPlanGrid {...props} />
			</MemoryRouter>,
		);

		const calendar = screen.getByRole("region", { name: "Weekly meal plan" });
		expect(calendar).toHaveClass("xl:grid-cols-7");
		expect(calendar).not.toHaveClass("lg:grid-cols-7");
	});

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
		expect(screen.getByRole("link", { name: "Start cooking Chicken Curry" }).querySelector("svg")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Change Chicken Curry" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Change Chicken Curry" }).querySelector("svg")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Move Chicken Curry" })).toBeNull();
		expect(screen.getByTestId("draggable-meal-4").getAttribute("aria-label")).toBe(
			"Drag Chicken Curry to another empty meal slot",
		);
		expect(screen.getByTestId("draggable-meal-4").parentElement).toHaveClass("min-w-0");
		expect(screen.getByRole("button", { name: "Remove Chicken Curry from dinner" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Remove Chicken Curry from dinner" }).querySelector("svg")).toBeTruthy();
		expect(screen.getByText("4×")).toBeTruthy();
		expect(screen.queryByText("Add recipe")).toBeNull();
		expect(screen.getAllByRole("button", { name: "Add recipe to Monday lunch" }).every((button) => button.querySelector("svg"))).toBe(true);
	});
});
