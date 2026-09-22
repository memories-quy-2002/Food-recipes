// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { buildMealCookingHref } from "./MealSlot";

describe("MealSlot leftover cooking links", () => {
	it("includes leftover provenance in the personal cooking route", () => {
		const href = buildMealCookingHref({
			item_id: 9,
			recipe_id: 42,
			servings: 2,
			planned_date: "2026-08-31",
			slot: "lunch",
			source_type: "leftover",
			leftover_batch_id: 8,
			recipe_name: "Soup",
		} as never);

		expect(href).toContain("sourceType=leftover");
		expect(href).toContain("leftoverBatchId=8");
	});
});