import { describe, expect, it } from "vitest";
import { formatDate, replayHref } from "./HistoryPage";

type ReplayFixture = Parameters<typeof replayHref>[0];

const replayFixture = (context: ReplayFixture) => replayHref(context);

describe("HistoryPage helpers", () => {
	it("replays a planned cook with its original meal context", () => {
		expect(replayFixture({
			recipe_id: 15,
			meal_plan_item_id: 42,
			planned_date: "2026-08-25T00:00:00.000Z",
			slot: "dinner",
			servings: 4,
		})).toBe("/recipe/cooking?id=15&planItemId=42&date=2026-08-25&slot=dinner&servings=4&returnTo=%2Fhistory");
	});

	it("keeps an unplanned replay lightweight", () => {
		expect(replayFixture({
			recipe_id: 16,
			meal_plan_item_id: null,
			planned_date: null,
			slot: null,
			servings: 1,
		})).toBe("/recipe/cooking?id=16");
	});

	it("formats completion timestamps with the user locale", () => {
		expect(formatDate("2026-08-25T17:35:00.000Z")).toContain("2026");
	});
});
