import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeIngredientList from "./RecipeIngredientList";

describe("recipe ingredient list", () => {
	it("renders ingredients as readable, non-interactive list items", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeIngredientList ingredients={["2 cups flour", "1 egg", "1 egg"]} />
			);
		});
		if (!renderer) throw new Error("Expected the ingredient list renderer");

		expect(renderer.root.findAllByType("input")).toHaveLength(0);
		expect(renderer.root.findAllByType("li")).toHaveLength(3);
		expect(renderer.root.findByProps({ className: "recipe__ingredient-list" })).toBeTruthy();
	});

	it("shows an empty state when no ingredients are available", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeIngredientList ingredients={[]} />);
		});
		if (!renderer) throw new Error("Expected the ingredient list renderer");

		expect(renderer.root.findByProps({ className: "recipe__ingredient-empty" }).children).toEqual(["No information"]);
	});

	it("prefers readable structured ingredients over the legacy strings", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeIngredientList
					ingredients={["legacy flour"]}
					structuredIngredients={[{ position: 0, quantityText: "1/2", unit: "cup", name: "flour", preparation: "sifted" }]}
				/>
			);
		});
		if (!renderer) throw new Error("Expected the ingredient list renderer");

		expect(renderer.root.findAllByType("li")[0].findAllByType("span").flatMap((node: ReactTestInstance) => node.children)).toEqual(["1/2 cup flour (sifted)"]);
	});
});
