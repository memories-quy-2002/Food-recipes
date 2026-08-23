import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import HomeSearchBar from "./HomeSearchBar";

const LocationSearch = () => {
	const location = useLocation();
	return <output>{location.pathname + location.search}</output>;
};

const recipes = [
	{ recipe_id: 1, recipe_name: "Pasta Primavera", category_name: "Dinner" },
	{ recipe_id: 2, recipe_name: "Pasta Salad", category_name: "Lunch" },
];

const renderSearchBar = (initialEntry = "/?q=Pasta") => {
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

const getInput = (renderer) => renderer.root.findByType("input");
const getList = (renderer) => renderer.root.findByProps({ role: "listbox" });
const getOptions = (renderer) =>
	renderer.root.findAllByProps({ role: "option" });

describe("HomeSearchBar keyboard accessibility", () => {
	it("exposes combobox/listbox semantics and announces the active option", () => {
		const renderer = renderSearchBar();

		expect(getInput(renderer).props.role).toBe("combobox");
		expect(getInput(renderer).props["aria-expanded"]).toBe(true);
		expect(getList(renderer).props["aria-label"]).toBe("Recipe search results");
		expect(getOptions(renderer)).toHaveLength(2);

		act(() => getInput(renderer).props.onKeyDown({ key: "ArrowDown", preventDefault() {} }));
		expect(getInput(renderer).props["aria-activedescendant"]).toBe(
			"recipe-search-option-0"
		);
		expect(getOptions(renderer)[0].props["aria-selected"]).toBe(true);

		act(() => getInput(renderer).props.onKeyDown({ key: "ArrowDown", preventDefault() {} }));
		expect(getInput(renderer).props["aria-activedescendant"]).toBe(
			"recipe-search-option-1"
		);
		act(() => getInput(renderer).props.onKeyDown({ key: "ArrowUp", preventDefault() {} }));
		expect(getInput(renderer).props["aria-activedescendant"]).toBe(
			"recipe-search-option-0"
		);
	});

	it("opens a recipe with Enter from the active result and supports mouse selection", () => {
		const renderer = renderSearchBar();

		act(() => getInput(renderer).props.onKeyDown({ key: "ArrowDown", preventDefault() {} }));
		act(() => getInput(renderer).props.onKeyDown({ key: "Enter", preventDefault() {} }));
		expect(renderer.root.findByType("output").children[0]).toBe("/recipe?id=1");

		const mouseRenderer = renderSearchBar();
		act(() => getOptions(mouseRenderer)[1].props.onClick());
		expect(mouseRenderer.root.findByType("output").children[0]).toBe("/recipe?id=2");
	});

	it("closes the result list without trapping focus and announces empty results", () => {
		const renderer = renderSearchBar();
		const input = getInput(renderer);

		act(() => input.props.onKeyDown({ key: "Escape", preventDefault() {} }));
		expect(getInput(renderer).props["aria-expanded"]).toBe(false);
		expect(renderer.root.findAllByProps({ role: "listbox" })).toHaveLength(0);
		expect(getInput(renderer).props.tabIndex).toBeUndefined();

		const emptyRenderer = renderSearchBar("/?q=does-not-exist");
		expect(getList(emptyRenderer).props["aria-live"]).toBe("polite");
		expect(getOptions(emptyRenderer)[0].children).toContain("No recipe found");
	});
});
