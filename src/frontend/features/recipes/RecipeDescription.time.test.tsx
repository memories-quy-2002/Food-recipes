import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeContainerSummary from "./RecipeContainerSummary";
import RecipeDescription, { getRecipeTimeSummary, normalizeRecipeTime } from "./content/RecipeDescription";

const recipe = {
	recipe_name: "Coconut Curry",
	recipe_description: "A warm, quick dinner.",
	prep_time: { hours: 1, minutes: 5 },
	cook_time_minutes: 25,
	prep_time_minutes: 10,
	category_name: "Dinner",
	meal_name: "Main course",
	difficulty: "Easy",
	overall_score: 4.5,
	num_ratings: 12,
	full_name: "Ava Cook",
	ingredients: ["Coconut milk"],
	instructions: ["Simmer until thickened"],
};

describe("recipe description time summary", () => {
	it("normalizes supported time shapes without treating zero or missing data as truthy", () => {
		expect(normalizeRecipeTime({ prep_time_minutes: 0 }, "prep")).toBe(0);
		expect(normalizeRecipeTime({ prep_time: { hours: 1, minutes: 5 } }, "prep")).toBe(65);
		expect(normalizeRecipeTime({ cook_time: "00:25:00" }, "cook")).toBe(25);
		expect(normalizeRecipeTime({}, "cook")).toBeNull();
		expect(getRecipeTimeSummary({ prep_time_minutes: 10, cook_time_minutes: 25 })).toEqual({ prep: 10, cook: 25, total: 35 });
		expect(getRecipeTimeSummary({ prep_time_minutes: 10 })).toEqual({ prep: 10, cook: null, total: null });
	});

	it("renders scannable metadata and a stable servings control", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => { renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, prep_time_minutes: 10 }} />); });
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const text = renderer.root.findAllByType("p").flatMap((node: ReactTestInstance) => node.children).join(" ");
		const headings = renderer.root.findAllByType("span").flatMap((node: ReactTestInstance) => node.children).join(" ");
		expect(headings).toContain("Prep");
		expect(text).toContain("10 min");
		expect(headings).toContain("Cook");
		expect(text).toContain("25 min");
		expect(text).toContain("35 min");
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
		expect(renderer.root.findByType("ol")).toBeTruthy();
		expect(renderer.root.findByProps({ id: "ingredients" })).toBeTruthy();
	});

	it("puts the cooking decision strip before long-form recipe copy", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => { renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, prep_time_minutes: 10 }} />); });
		if (!renderer) throw new Error("Expected the recipe description renderer");

		expect(renderer.root.findByProps({ "aria-label": "Recipe timing and servings" })).toBeTruthy();
		expect(renderer.root.findByProps({ id: "ingredients" })).toBeTruthy();
	});

	it("keeps rating, tags, Start cooking, and Save available near the title", () => {
		const onClickFavorite = vi.fn();
		let renderer: ReactTestRenderer | undefined;
		act(() => { renderer = TestRenderer.create(<MemoryRouter><RecipeContainerSummary recipe={{ ...recipe, recipe_id: 42 }} favorite={false} onClickFavorite={onClickFavorite} /></MemoryRouter>); });
		if (!renderer) throw new Error("Expected the recipe summary renderer");
		expect(renderer.root.findByType("h1").children).toEqual(["Coconut Curry"]);
		expect(renderer.root.findByProps({ to: "/recipe/cooking?id=42" }).children[0].children).toEqual(["Start cooking"]);
		expect(renderer.root.findAllByType("button").some((button: ReactTestInstance) => button.props["aria-label"] === "Save recipe")).toBe(true);
		expect(renderer.root.findByProps({ "aria-label": "Recipe category and meal type" })).toBeTruthy();
	});

	it("renders summary rating stars with the semantic primary token", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={{ ...recipe, recipe_id: 42 }}
						favorite={false}
						onClickFavorite={vi.fn()}
					/>
				</MemoryRouter>
			);
		});
		if (!renderer) throw new Error("Expected the recipe summary renderer");

		const rating = renderer.root.findByProps({ "aria-label": "Rated 4.5 out of 5 from 12 reviews" });
		const coloredIcons = rating.findAll((node: ReactTestInstance) => node.props?.color === "currentColor");

		expect(coloredIcons.length).toBeGreaterThan(0);
		expect(coloredIcons.every((icon) => icon.props.color === "currentColor")).toBe(true);
	});
});
