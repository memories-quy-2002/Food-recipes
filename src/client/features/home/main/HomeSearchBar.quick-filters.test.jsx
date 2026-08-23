import { describe, expect, it } from "vitest";
import { getQuickFilters } from "./HomeSearchBar";

describe("getQuickFilters", () => {
	it("derives popular, unique taxonomy labels from recipe summaries", () => {
		expect(
			getQuickFilters([
				{ category_name: "Dinner", meal_name: "Pasta" },
				{ category_name: "dinner", meal_name: "Soup" },
				{ category_name: "Dessert", meal_name: "Pasta" },
				{ category_name: "", meal_name: null },
			])
		).toEqual(["Dinner", "Pasta", "Soup", "Dessert"]);
	});

	it("returns no chips when recipes have no usable taxonomy labels", () => {
		expect(getQuickFilters([{ recipe_name: "Untitled" }, null])).toEqual([]);
	});
});
