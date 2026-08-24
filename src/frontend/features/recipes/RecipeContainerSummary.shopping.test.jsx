import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeContainerSummary from "./RecipeContainerSummary";

const recipe = {
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	category_name: "Dinner",
	meal_name: "Main course",
	overall_score: 4.5,
	num_ratings: 12,
	full_name: "Ava Cook",
};

describe("RecipeContainerSummary shopping action", () => {
	it("exposes the recipe ingredient import action and forwards clicks", () => {
		const onAddIngredients = vi.fn();
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={false}
						onClickFavorite={vi.fn()}
						onAddIngredients={onAddIngredients}
					/>
				</MemoryRouter>,
			);
		});

			const button = renderer.root.findAllByType("button").find(
				(node) => node.props.className === "recipe__container__summary__shopping",
			);
			expect(button.props["aria-busy"]).toBe(false);
			expect(button.findByType("strong").children).toEqual(["Add ingredients to shopping list"]);

		act(() => button.props.onClick());
		expect(onAddIngredients).toHaveBeenCalledTimes(1);
	});

	it("communicates the pending state and prevents duplicate clicks", () => {
		const onAddIngredients = vi.fn();
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={false}
						onClickFavorite={vi.fn()}
						onAddIngredients={onAddIngredients}
						isAddingIngredients
					/>
				</MemoryRouter>,
			);
		});

			const button = renderer.root.findAllByType("button").find(
				(node) => node.props.className === "recipe__container__summary__shopping",
			);
			expect(button.props.disabled).toBe(true);
			expect(button.props["aria-busy"]).toBe(true);
			expect(button.findByType("strong").children).toEqual(["Adding ingredients..."]);
	});
});
