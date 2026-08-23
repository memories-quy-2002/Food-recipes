import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import RecipeContainerSummary from "./RecipeContainerSummary";
import RecipeDescription, { getRecipeTimeSummary, normalizeRecipeTime } from "./recipeContent/RecipeDescription";

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

describe("recipe detail Task 10", () => {
	it("normalizes supported time shapes without treating zero or missing data as truthy", () => {
		expect(normalizeRecipeTime({ prep_time_minutes: 0 }, "prep")).toBe(0);
		expect(normalizeRecipeTime({ prep_time: { hours: 1, minutes: 5 } }, "prep")).toBe(65);
		expect(normalizeRecipeTime({ cook_time: "00:25:00" }, "cook")).toBe(25);
		expect(normalizeRecipeTime({}, "cook")).toBeNull();
		expect(getRecipeTimeSummary({ prep_time_minutes: 10, cook_time_minutes: 25 })).toEqual({ prep: 10, cook: 25, total: 35 });
		expect(getRecipeTimeSummary({ prep_time_minutes: 10 })).toEqual({ prep: 10, cook: null, total: null });
	});

	it("renders scannable metadata and a stable servings control", () => {
		let renderer;
		act(() => { renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, prep_time_minutes: 10 }} />); });
		const text = renderer.root.findAllByType("p").flatMap((node) => node.children).join(" ");
		const headings = renderer.root.findAllByType("h3").flatMap((node) => node.children).join(" ");
		expect(headings).toContain("Prep");
		expect(text).toContain("10 min");
		expect(headings).toContain("Cook");
		expect(text).toContain("25 min");
		expect(text).toContain("35 min");
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
		expect(renderer.root.findByType("ol")).toBeTruthy();
		expect(renderer.root.findByProps({ id: "ingredients" })).toBeTruthy();
	});

	it("keeps rating, tags, Start cooking, and Save available near the title", () => {
		const onClickFavorite = vi.fn();
		let renderer;
		act(() => { renderer = TestRenderer.create(<RecipeContainerSummary recipe={recipe} favorite={false} onClickFavorite={onClickFavorite} />); });
		expect(renderer.root.findByType("h1").children).toEqual(["Coconut Curry"]);
		expect(renderer.root.findByProps({ href: "#ingredients" }).children).toEqual(["Start cooking"]);
		expect(renderer.root.findByType("button").props["aria-label"]).toBe("Add to favorite");
		expect(renderer.root.findByProps({ "aria-label": "Recipe details" })).toBeTruthy();
	});
});
