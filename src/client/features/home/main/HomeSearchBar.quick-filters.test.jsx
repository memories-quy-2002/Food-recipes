import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { getQuickFilters } from "./HomeSearchBar";
import HomeSearchBar from "./HomeSearchBar";

const LocationSearch = () => {
	const location = useLocation();
	return <output>{location.search}</output>;
};

const renderSearchBar = (recipes, initialEntry = "/") => {
	let renderer;
	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter initialEntries={[initialEntry]}>
				<HomeSearchBar recipes={recipes} />
				<LocationSearch />
			</MemoryRouter>
		);
	});
	return renderer;
};

describe("getQuickFilters", () => {
	it("derives popular, unique taxonomy labels from recipe summaries", () => {
		expect(
			getQuickFilters([
				{ category_name: "Dinner", meal_name: "Pasta" },
				{ category_name: "dinner", meal_name: "Soup" },
				{ category_name: "Dessert", meal_name: "Pasta" },
				{ category_name: "", meal_name: null },
			])
		).toEqual(["Dinner", "Pasta", "Soup", "Dessert"]);
	});

	it("returns no chips when recipes have no usable taxonomy labels", () => {
		expect(getQuickFilters([{ recipe_name: "Untitled" }, null])).toEqual([]);
	});
});

describe("HomeSearchBar search state", () => {
	it("reflects a quick-filter selection in the input and URL", () => {
		const renderer = renderSearchBar([
			{ recipe_name: "Pasta Primavera", category_name: "Dinner", meal_name: "Pasta" },
		]);

		act(() => {
			renderer.root.findByProps({ children: "Dinner" }).props.onClick();
		});

		expect(renderer.root.findByType("input").props.value).toBe("Dinner");
		expect(
			new URLSearchParams(renderer.root.findByType("output").children[0]).get("q")
		).toBe("Dinner");
	});

	it("restores q into the controlled input and matching results", () => {
		const renderer = renderSearchBar(
			[
				{ recipe_id: 1, recipe_name: "Pasta Primavera", category_name: "Dinner", meal_name: "Pasta" },
				{ recipe_id: 2, recipe_name: "Tomato Soup", category_name: "Lunch", meal_name: "Soup" },
			],
			"/?q=Pasta"
		);

		expect(renderer.root.findByType("input").props.value).toBe("Pasta");
		expect(
			renderer.root.findAllByType("p").some((node) =>
				node.children.includes("Pasta Primavera")
			)
		).toBe(true);
	});

	it("removes q when the search input is cleared", () => {
		const renderer = renderSearchBar(
			[{ recipe_name: "Pasta Primavera", category_name: "Dinner", meal_name: "Pasta" }],
			"/?q=Pasta&sort=popular"
		);

		act(() => {
			renderer.root.findByType("input").props.onChange({ target: { value: "" } });
		});

		const params = new URLSearchParams(renderer.root.findByType("output").children[0]);
		expect(params.get("q")).toBeNull();
		expect(params.get("sort")).toBe("popular");
	});
});
