import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeDescription from "./RecipeDescription";

const renderDescription = (recipe) => {
	let renderer;
	act(() => {
		renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
	});
	return renderer;
};

const recipe = {
	recipe_id: 13,
	recipe_description: "A recipe with detailed steps.",
	ingredients: [],
};

describe("recipe instructions", () => {
	it("renders ordered steps with separate explicit numbers and exact text order", () => {
		const instructions = [
			" First step keeps its leading space.",
			"Add the sauce, then simmer until the mixture is thick and glossy.",
		];
		const renderer = renderDescription({ ...recipe, instructions });
		const list = renderer.root.findByType("ol");
		const items = list.findAllByType("li");

		expect(list.props.className).toContain("recipe__instruction-steps");
		expect(items).toHaveLength(2);
		expect(items.map((item) => item.findByProps({ className: "recipe__instruction-step-number" }).children.join(""))).toEqual(["1", "2"]);
		expect(items.map((item) => item.findByProps({ className: "recipe__instruction-step-text" }).children.join(""))).toEqual(instructions);
	});

	it.each([undefined, [], [""], ["   "], [null], ["", "   ", null]])("shows an accessible fallback when no meaningful instructions remain: %s", (instructions) => {
		const renderer = renderDescription({ ...recipe, instructions });
		const instructionSection = renderer.root.findByProps({ className: "recipe__content__instruction" });

		expect(instructionSection.findAllByType("ol")).toHaveLength(0);
		expect(instructionSection.findByProps({ role: "status" }).children).toEqual(["No information"]);
	});

	it("omits empty entries and assigns explicit sequential number/text pairs to valid steps", () => {
		const instructions = [null, " First valid step keeps its leading space.", "   ", "Second valid step", ""];
		const renderer = renderDescription({ ...recipe, instructions });
		const items = renderer.root.findByType("ol").findAllByType("li");

		expect(items).toHaveLength(2);
		expect(items.map((item) => ({
			number: item.findByProps({ className: "recipe__instruction-step-number" }).children.join(""),
			text: item.findByProps({ className: "recipe__instruction-step-text" }).children.join(""),
		}))).toEqual([
			{ number: "1", text: " First valid step keeps its leading space." },
			{ number: "2", text: "Second valid step" },
		]);
	});
});
