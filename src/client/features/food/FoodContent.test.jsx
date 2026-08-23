import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import FoodContent, {
	getRecipeContentState,
	getVisibleRecipes,
} from "./FoodContent";

vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
}));

const recipes = [
	{ recipe_id: 1, recipe_name: "Pasta", category_id: 1, category_name: "Dinner" },
	{ recipe_id: 2, recipe_name: "Soup", category_id: 1, category_name: "Dinner" },
	{ recipe_id: 3, recipe_name: "Toast", category_id: 2, category_name: "Breakfast" },
];

describe("FoodContent", () => {
	it("keeps a stable page slice while the server contract lacks pagination metadata", () => {
		expect(getVisibleRecipes(recipes, { page: 2, limit: 2 })).toEqual([recipes[2]]);
	});

	it("renders loading, error, and empty states without removing the content region", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<FoodContent
					recipes={[]}
					queryState={{ page: 1, limit: 6, sort: "popular" }}
					isLoading
				/>
		);
		});
		expect(renderer.root.findByProps({ className: "food__content__loading" })).toBeTruthy();

		act(() => {
			renderer.update(
				<FoodContent
					recipes={[]}
					queryState={{ page: 1, limit: 6, sort: "popular" }}
					error="Request failed"
				/>
			);
		});
		expect(renderer.root.findByProps({ className: "food__content__error" })).toBeTruthy();

		act(() => {
			renderer.update(
				<FoodContent
					recipes={[]}
					queryState={{ page: 1, limit: 6, sort: "popular" }}
				/>
			);
		});
		expect(renderer.root.findByProps({ className: "food__content__empty" })).toBeTruthy();
	});

	it("identifies pagination when the compatibility response has more local rows", () => {
		expect(getRecipeContentState(recipes, { page: 1, limit: 2 })).toEqual({
			isEmpty: false,
			totalPages: 2,
		});
	});
});
