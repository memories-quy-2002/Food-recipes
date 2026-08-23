import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import FoodContent, {
	getRecipeContentState,
	getVisibleRecipes,
} from "./FoodContent";

vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
	Link: ({ children, ...props }) => <a {...props}>{children}</a>,
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

	it("keeps previous recipes visible and exposes an accessible updating state during a query transition", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<FoodContent
					recipes={recipes}
					queryState={{ page: 1, limit: 6, sort: "popular" }}
				/>
			);
		});

		expect(renderer.root.findByProps({ "aria-label": "Open Pasta" })).toBeTruthy();

		act(() => {
			renderer.update(
				<FoodContent
					recipes={recipes}
					queryState={{ page: 1, limit: 6, sort: "popular", q: "soup" }}
					isFetching
				/>
			);
		});

		const content = renderer.root.findByProps({ className: "food__content" });
		expect(content.props["aria-busy"]).toBe(true);
		expect(renderer.root.findByProps({ className: "food__content__updating" })).toBeTruthy();
		expect(renderer.root.findByProps({ className: "food__content__section__list food__content__section__list--grid" })).toBeTruthy();
		expect(renderer.root.findByProps({ "aria-label": "Open Pasta" })).toBeTruthy();

		act(() => {
			renderer.update(
				<FoodContent
					recipes={[recipes[1]]}
					queryState={{ page: 1, limit: 6, sort: "popular", q: "soup" }}
				/>
			);
		});

		expect(renderer.root.findByProps({ "aria-label": "Open Soup" })).toBeTruthy();
		expect(renderer.root.findAllByProps({ className: "food__content__updating" })).toHaveLength(0);
		expect(renderer.root.findByProps({ className: "food__content" }).props["aria-busy"]).toBe(false);
	});

	it("identifies pagination when the compatibility response has more local rows", () => {
		expect(getRecipeContentState(recipes, { page: 1, limit: 2 })).toEqual({
			isEmpty: false,
			totalPages: 2,
		});
	});

	it("renders a server-paginated page directly without sorting or slicing it again", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<FoodContent
					recipes={[recipes[2], recipes[1]]}
					pagination={{ page: 2, limit: 2, total: 4, totalPages: 2, hasNext: false }}
					queryState={{ page: 2, limit: 2, sort: "name" }}
				/>
			);
		});

		expect(renderer.root.findByProps({ "aria-label": "Open Toast" })).toBeTruthy();
		expect(renderer.root.findByProps({ "aria-label": "Open Soup" })).toBeTruthy();
		expect(renderer.root.findAllByType("a")
			.map(({ props }) => props["aria-label"])
			.filter(Boolean)).toEqual(["Open Toast", "Open Soup"]);
		expect(renderer.root.findAllByType("h2")[0].props.children).toBe("4 recipes found");
	});

	it("uses the server-clamped page as the active pagination page", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<FoodContent
					recipes={[recipes[0]]}
					pagination={{ page: 2, limit: 1, total: 3, totalPages: 3, hasNext: true }}
					queryState={{ page: 1000000, limit: 1, sort: "popular" }}
				/>
			);
		});

		const activeItems = renderer.root.findAll((node) => node.props?.active === true);
		expect(activeItems).toHaveLength(1);
		expect(activeItems[0].props.children).toBe(2);
	});
});
