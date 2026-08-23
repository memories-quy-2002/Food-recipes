import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeDescription, { normalizeServings } from "./recipeContent/RecipeDescription";

const recipe = {
	recipe_description: "A simple recipe.",
	servings: 4,
	ingredients: ["2 cups flour", "1 egg"],
	instructions: ["Mix everything"],
};

describe("recipe servings Task 11", () => {
	it("clamps valid servings and keeps the selected value visible", () => {
		expect(normalizeServings(undefined)).toBe(4);
		expect(normalizeServings(0)).toBe(1);
		expect(normalizeServings(120)).toBe(99);

		let renderer;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});

		const decrement = renderer.root.findByProps({ "aria-label": "Decrease servings" });
		const increment = renderer.root.findByProps({ "aria-label": "Increase servings" });
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);

		act(() => increment.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["5"]);

		act(() => decrement.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
	});

	it("does not rewrite free-text ingredient quantities", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});

		const ingredientText = renderer.root.findByProps({ id: "ingredients" }).findAllByType("li").flatMap((node) => node.children);
		expect(ingredientText).toEqual(["2 cups flour", "1 egg"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("shown as written");
	});
});
