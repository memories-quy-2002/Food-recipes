import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeDescription, { normalizeServings } from "./content/RecipeDescription";

const recipe = {
	recipe_id: 1,
	recipe_description: "A simple recipe.",
	servings: 4,
	ingredients: ["2 cups flour", "1 egg"],
	instructions: ["Mix everything"],
};

describe("recipe servings", () => {
	it("clamps valid servings and keeps the selected value visible", () => {
		expect(normalizeServings(undefined)).toBe(4);
		expect(normalizeServings(0)).toBe(1);
		expect(normalizeServings(120)).toBe(99);

		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		const decrement = renderer.root.findByProps({ "aria-label": "Decrease servings" });
		const increment = renderer.root.findByProps({ "aria-label": "Increase servings" });
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
		expect(renderer.root.findAllByType("button").some((node: ReactTestInstance) => node.props["aria-label"] === "Decrease servings")).toBe(true);
		expect(renderer.root.findAllByType("button").filter((node: ReactTestInstance) => node.props["aria-label"]).every((node: ReactTestInstance) => node.props.type === "button")).toBe(true);

		act(() => increment.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["5"]);

		act(() => decrement.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
	});

	it("resets local servings when the recipe identity changes", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		const increment = renderer.root.findByProps({ "aria-label": "Increase servings" });
		act(() => increment.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["5"]);

		act(() => renderer.update(<RecipeDescription recipe={{ ...recipe, recipe_id: 2, servings: 2 }} />));
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["2"]);
	});

	it("disables and does not change at the serving boundaries", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, servings: 1 }} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const decrement = renderer.root.findByProps({ "aria-label": "Decrease servings" });
		expect(decrement.props.disabled).toBe(true);
		act(() => decrement.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["1"]);

		act(() => renderer.update(<RecipeDescription recipe={{ ...recipe, recipe_id: 2, servings: 99 }} />));
		const increment = renderer.root.findByProps({ "aria-label": "Increase servings" });
		expect(increment.props.disabled).toBe(true);
		act(() => increment.props.onClick());
		expect(renderer.root.findByProps({ "aria-live": "polite" }).children).toEqual(["99"]);
	});

	it("does not rewrite free-text ingredient quantities", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		const ingredientText = renderer.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual(["2 cups flour", "1 egg"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("shown as written");
	});

	it("does not classify unsupported ingredient objects as scalable", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, ingredients: [{ name: "flour", quantity: 2, unit: "cups" }] }} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		const ingredientText = renderer.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual([JSON.stringify({ name: "flour", quantity: 2, unit: "cups" })]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("unsupported");
	});

	it("renders nutrition and dietary metadata when supplied by the API", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{
				...recipe,
				structuredIngredients: [{ quantityText: "1", unit: "cup", name: "flour", preparation: null }],
				nutrition: { servings: 2, calories: 100, protein: 3, carbohydrates: 10, fat: 2, fiber: 1, sugar: 2, sodium: 20 },
				dietaryTags: ["vegetarian"],
				allergenTags: ["wheat"],
			}} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		expect(renderer.root.findAllByType("h2").some((node: ReactTestInstance) => node.children.join("") === "Nutrition per serving")).toBe(true);
		expect(renderer.root.findAllByType("span").some((node: ReactTestInstance) => node.children.join("").includes("100 calories"))).toBe(true);
		expect(renderer.root.findAllByType("span").some((node: ReactTestInstance) => node.children.join("") === "vegetarian")).toBe(true);
		expect(renderer.root.findAllByType("p").some((node: ReactTestInstance) => node.children.includes("wheat"))).toBe(true);
	});

	it("scales structured ingredient quantities from the recipe serving baseline", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{
				...recipe,
				structured_ingredients: [{ name: "chicken breast", quantity: 500, unit: "GRAM", note: "diced" }],
			}} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");

		act(() => renderer.root.findByProps({ "aria-label": "Increase servings" }).props.onClick());
		const ingredientText = renderer.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual(["625 g chicken breast, diced"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("scaled");
	});
});
