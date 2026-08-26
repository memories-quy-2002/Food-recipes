import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
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
		let renderer: ReactTestRenderer | undefined;
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
		if (!renderer) throw new Error("Expected the recipe summary renderer");

			const button = renderer.root.findAllByType("button").find(
				(node: ReactTestInstance) => node.props["aria-label"] === "Add ingredients to shopping list",
			);
			if (!button) throw new Error("Expected the shopping-list button");
			expect(button.props["aria-busy"]).toBe(false);
			expect(button.children).toContain("Add ingredients to shopping list");

		const onClick = button.props.onClick;
		if (typeof onClick !== "function") throw new Error("Expected the shopping-list click handler");
		act(() => onClick());
		expect(onAddIngredients).toHaveBeenCalledTimes(1);
	});

	it("communicates the pending state and prevents duplicate clicks", () => {
		const onAddIngredients = vi.fn();
		let renderer: ReactTestRenderer | undefined;
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
		if (!renderer) throw new Error("Expected the recipe summary renderer");

			const button = renderer.root.findAllByType("button").find(
				(node: ReactTestInstance) => node.props["aria-label"] === "Adding ingredients to shopping list",
			);
			if (!button) throw new Error("Expected the pending shopping-list button");
			expect(button.props.disabled).toBe(true);
			expect(button.props["aria-busy"]).toBe(true);
			expect(button.children).toContain("Adding ingredients…");
	});
});
