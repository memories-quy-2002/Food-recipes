import { describe, expect, it } from "vitest";
import { getPrimaryNavigation } from "./navigation";

describe("primary navigation", () => {
	it("uses user-facing recipe labels and keeps compatible routes", () => {
		expect(getPrimaryNavigation(false, true)).toEqual([
			{ title: "Home", href: "/" },
			{ title: "Recipes", href: "/food" },
			{ title: "Saved", href: "/wishlist" },
			{ title: "Health", href: "/health" },
		]);
	});

	it("shows Add Recipe only for authenticated users", () => {
		expect(getPrimaryNavigation(true)).toContainEqual({
			title: "Add Recipe",
			href: "/food/add",
		});
		expect(getPrimaryNavigation(false)).not.toContainEqual({
			title: "Add Recipe",
			href: "/food/add",
		});
	});
});
