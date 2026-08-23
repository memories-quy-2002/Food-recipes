import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeIngredientChecklist from "./RecipeIngredientChecklist";

const recipeIngredients = ["2 cups flour", "1 egg", "1 egg"];

describe("recipe ingredient checklist", () => {

	it("checks one duplicate ingredient without checking the other or mutating recipe data", () => {
		const ingredients = [...recipeIngredients];
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeIngredientChecklist recipeIdentity="recipe-1" ingredients={ingredients} />
			);
		});

		const checkboxes = renderer.root.findAllByType("input");
		expect(checkboxes).toHaveLength(3);
		expect(checkboxes[0].props.type).toBe("checkbox");
		expect(checkboxes[0].props["aria-label"]).toBe("Mark 2 cups flour as complete");
		expect(checkboxes[0].props.checked).toBe(false);

		act(() => checkboxes[1].props.onChange({ target: { checked: true } }));

		expect(renderer.root.findAllByType("input")[1].props.checked).toBe(true);
		expect(renderer.root.findAllByType("input")[2].props.checked).toBe(false);
		expect(ingredients).toEqual(recipeIngredients);
		expect(renderer.root.findAllByType("label")[1].props.className).toContain("is-checked");
	});

	it("resets local checks when the recipe identity or ingredient content changes", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeIngredientChecklist recipeIdentity="recipe-1" ingredients={["flour", "water"]} />
			);
		});

		act(() => renderer.root.findAllByType("input")[0].props.onChange({ target: { checked: true } }));
		expect(renderer.root.findAllByType("input")[0].props.checked).toBe(true);

		act(() => renderer.update(
			<RecipeIngredientChecklist recipeIdentity="recipe-2" ingredients={["salt", "water"]} />
		));
		expect(renderer.root.findAllByType("input")[0].props.checked).toBe(false);

		act(() => renderer.root.findAllByType("input")[1].props.onChange({ target: { checked: true } }));
		act(() => renderer.update(
			<RecipeIngredientChecklist recipeIdentity="recipe-2" ingredients={["pepper", "water"]} />
		));
		expect(renderer.root.findAllByType("input")[0].props.checked).toBe(false);
	});

	it("keeps each ingredient label readable and provides a large tap target", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeIngredientChecklist recipeIdentity="recipe-1" ingredients={["500 g chicken breast"]} />
			);
		});

		const label = renderer.root.findByType("label");
		expect(label.props.htmlFor).toBe("recipe-1-ingredient-0");
		expect(label.props.className).toContain("recipe__ingredient-checklist__item");
		expect(label.findByType("span").children).toEqual(["500 g chicken breast"]);
	});
});
