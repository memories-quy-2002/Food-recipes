import { describe, expect, it } from "vitest";
import { featuredModeMeta } from "./FoodCardList";

describe("FoodCardList featured mode contract", () => {
	it("defines the exact labels for every supported featured mode", () => {
		expect(featuredModeMeta).toEqual({
			"top-rated": {
				eyebrow: "Community favorites",
				title: "Top rated recipes",
			},
			"most-reviewed": {
				eyebrow: "Popular with cooks",
				title: "Most reviewed recipes",
			},
			"quick-meals": {
				eyebrow: "Short on time",
				title: "Quick meals",
			},
		});
	});

	it("keeps the supported mode keys aligned with the selected tab contract", () => {
		expect(Object.keys(featuredModeMeta)).toEqual([
			"top-rated",
			"most-reviewed",
			"quick-meals",
		]);
	});
});
