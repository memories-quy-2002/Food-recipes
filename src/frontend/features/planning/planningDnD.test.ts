import { describe, expect, it } from "vitest";
import type { MealPlanItem, MealSlot } from "./api/planningApi";
import { getMealDropAnnouncement, resolveMealDrop, resolveMealDropTarget } from "./planningDnD";

const item = (overrides: Partial<MealPlanItem> = {}): MealPlanItem => ({
	item_id: 4,
	plan_id: 12,
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	planned_date: "2026-08-24",
	slot: "dinner",
	servings: 4,
	created_at: "2026-08-24T00:00:00.000Z",
	...overrides,
});

describe("resolveMealDrop", () => {
	it("rejects a drop into a slot that already has another meal", () => {
		const result = resolveMealDrop(
			[item(), item({ item_id: 9, recipe_name: "Tomato Soup", slot: "lunch" })],
			4,
			{ date: "2026-08-24", slot: "lunch" },
		);

		expect(result).toEqual({
			status: "occupied",
			message: "This slot already has a meal.",
			occupiedItemId: 9,
		});
	});

	it("returns a move payload for an empty slot", () => {
		const result = resolveMealDrop([item()], 4, { date: "2026-08-25", slot: "dinner" });

		expect(result).toEqual({
			status: "move",
			input: { date: "2026-08-25", slot: "dinner" as MealSlot },
		});
	});

	it("treats dropping an item back into its current slot as a no-op", () => {
		expect(resolveMealDrop([item()], 4, { date: "2026-08-24", slot: "dinner" })).toEqual({ status: "noop" });
	});

	it("normalizes an occupied meal card target to its date and slot", () => {
		expect(resolveMealDropTarget("meal-item:9", [item({ item_id: 9, planned_date: "2026-08-25", slot: "lunch" })])).toEqual({
			date: "2026-08-25",
			slot: "lunch",
		});
	});

	it("announces the occupied-slot rejection for assistive technology", () => {
		expect(getMealDropAnnouncement(
			[item(), item({ item_id: 9, recipe_name: "Tomato Soup", slot: "lunch" })],
			"meal-item:4",
			"meal-slot:2026-08-24:lunch",
			"end",
		)).toBe("This slot already has a meal.");
	});
});
