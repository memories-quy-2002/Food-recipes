// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KitchenState } from "@/shared/api/contracts";

const prepare = vi.fn();
vi.mock("@/features/leftovers/api/leftoversQueries", () => ({
	useLeftoversQuery: () => ({ data: { items: [] }, isPending: false }),
}));
vi.mock("@/features/shopping/api/shoppingQueries", () => ({
	usePrepareRecipeIngredientsMutation: () => ({
		isPending: false,
		mutate: prepare,
	}),
}));

import KitchenCommandCenter, { progressSteps } from "./KitchenCommandCenter";

const kitchen: KitchenState = {
	active_session: {
		session_id: 9,
		recipe_id: 42,
		recipe_name: "Pasta",
		meal_plan_item_id: 12,
		planned_date: "2026-08-27",
		slot: "dinner",
		servings: 2,
		current_step: 1,
		total_steps: 4,
		status: "paused",
		updated_at: "2026-08-27T10:00:00.000Z",
	},
	next_meal: {
		item_id: 12,
		plan_id: 4,
		recipe_id: 42,
		recipe_name: "Pasta",
		planned_date: "2026-08-27",
		slot: "dinner",
		servings: 2,
	},
	shopping: { open_items: 3, completed_items: 1 },
	pantry: { available_items: 4 },
	progress: { saved_recipes: 1, planned_meals: 1, completed_cooks: 0 },
};

describe("KitchenCommandCenter", () => {
	afterEach(cleanup);

	beforeEach(() => {
		window.localStorage.clear();
		prepare.mockClear();
	});

	it("shows the current cooking action and next meal preparation action", () => {
		render(<MemoryRouter><KitchenCommandCenter kitchen={kitchen} userId={7} /></MemoryRouter>);

		expect(screen.getByRole("heading", { name: "Continue Pasta" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Continue cooking/ })).toHaveAttribute("href", expect.stringContaining("planItemId=12"));
		expect(screen.getByRole("button", { name: "Prepare this meal" })).toBeInTheDocument();
		expect(screen.getByText("How your kitchen works")).toBeInTheDocument();
	});

	it("persists guide dismissal per user", () => {
		render(<MemoryRouter><KitchenCommandCenter kitchen={kitchen} userId={7} /></MemoryRouter>);
		fireEvent.click(screen.getByRole("button", { name: "Hide guide" }));

		expect(screen.queryByText("How your kitchen works")).not.toBeInTheDocument();
		expect(window.localStorage.getItem("food-recipes:onboarding:kitchen:7")).toBe("dismissed");
	});
});

describe("progressSteps", () => {
	it("makes the next action understandable for a new user", () => {
		const steps = progressSteps({
			active_session: null,
			next_meal: null,
			shopping: { open_items: 0, completed_items: 0 },
			pantry: { available_items: 0 },
			progress: { saved_recipes: 0, planned_meals: 0, completed_cooks: 0 },
		});

		expect(steps[0]).toMatchObject({ label: "Choose a recipe", href: "/food", complete: false });
	});
});
