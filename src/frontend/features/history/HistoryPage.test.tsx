import { describe, expect, it } from "vitest";
import { formatDate, replayHref } from "./HistoryPage";

describe("HistoryPage helpers", () => {
	it("replays a planned cook with its original meal context", () => {
		expect(replayHref({
			history_id: 1,
			recipe_id: 15,
			recipe_name: "Pasta",
			meal_plan_item_id: 42,
			planned_date: "2026-08-25T00:00:00.000Z",
			slot: "dinner",
			servings: 4,
			started_at: "2026-08-25T17:00:00.000Z",
			completed_at: "2026-08-25T17:35:00.000Z",
			created_at: "2026-08-25T17:35:00.000Z",
		})).toBe("/recipe/cooking?id=15&planItemId=42&date=2026-08-25&slot=dinner&servings=4&returnTo=%2Fhistory");
	});

	it("keeps an unplanned replay lightweight", () => {
		expect(replayHref({
			history_id: 2,
			recipe_id: 16,
			recipe_name: "Soup",
			meal_plan_item_id: null,
			planned_date: null,
			slot: null,
			servings: 1,
			started_at: "2026-08-25T17:00:00.000Z",
			completed_at: "2026-08-25T17:35:00.000Z",
			created_at: "2026-08-25T17:35:00.000Z",
		})).toBe("/recipe/cooking?id=16");
	});

	it("formats completion timestamps with the user locale", () => {
		expect(formatDate("2026-08-25T17:35:00.000Z")).toContain("2026");
	});
});
