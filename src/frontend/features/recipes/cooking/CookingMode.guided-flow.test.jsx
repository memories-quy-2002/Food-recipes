import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import CookingMode, { getCookingInstructions } from "./CookingMode";

const recipe = {
	recipe_id: 42,
	recipe_name: "Coconut Curry",
	 ingredients: ["Coconut milk", "Rice"],
	instructions: [
		" First step keeps its exact spacing.",
		"Simmer until thick and glossy.",
	],
};

const renderCookingMode = (props = {}) => {
	let renderer;
	act(() => {
		renderer = TestRenderer.create(
			<CookingMode recipe={recipe} onExit={vi.fn()} {...props} />
		);
	});
	return renderer;
};

const findButton = (renderer, name) =>
	renderer.root.findAllByType("button").find((button) => button.children.join("") === name);

const findByRole = (renderer, role) =>
	renderer.root.findAll((node) => node.props.role === role)[0];

const findText = (renderer, text) =>
	renderer.root.findAll((node) => node.children.join("") === text)[0];

describe("cooking mode guided flow", () => {
	it("shows planned meal context and offers a return to plan after completion", () => {
		const onBackToPlan = vi.fn();
		const renderer = renderCookingMode({
			planningContext: {
				date: "2026-08-24",
				slot: "dinner",
				servings: 4,
				returnTo: "/planning",
			},
			onBackToPlan,
		});

		expect(findText(renderer, "Monday · Dinner · 4 servings")).toBeTruthy();
		act(() => findButton(renderer, "Next step").props.onClick());
		act(() => findButton(renderer, "Finish cooking").props.onClick());
		expect(findText(renderer, "Recipe complete")).toBeTruthy();
		expect(findButton(renderer, "Back to plan")).toBeTruthy();
		act(() => findButton(renderer, "Back to plan").props.onClick());
		expect(onBackToPlan).toHaveBeenCalledOnce();
	});

	it("preserves instruction order and exact text while exposing the current step", () => {
		expect(getCookingInstructions(recipe)).toEqual(recipe.instructions);
		const renderer = renderCookingMode();

		expect(renderer.root.findByType("h1").children).toEqual(["Coconut Curry"]);
		expect(findText(renderer, "Step 1 of 2")).toBeTruthy();
		expect(findText(renderer, recipe.instructions[0])).toBeTruthy();
		expect(renderer.root.findAll((node) => node.children.join("") === recipe.instructions[1])).toHaveLength(0);
		expect(findButton(renderer, "Previous step").props.disabled).toBe(true);
		expect(findButton(renderer, "Next step").props.disabled).toBe(false);
	});

	it("navigates with controls and keyboard arrows without changing the recipe", () => {
		const renderer = renderCookingMode();
		const next = findButton(renderer, "Next step");

		act(() => next.props.onClick());
		expect(findText(renderer, "Step 2 of 2")).toBeTruthy();
		expect(findText(renderer, recipe.instructions[1])).toBeTruthy();
		expect(findButton(renderer, "Next step").props.disabled).toBe(true);
		expect(findButton(renderer, "Finish cooking")).toBeTruthy();

		const mode = renderer.root.findByType("main");
		act(() => mode.props.onKeyDown({ key: "ArrowLeft", preventDefault: vi.fn() }));
		expect(findText(renderer, "Step 1 of 2")).toBeTruthy();
	});

	it("resets the step when the recipe changes to fewer instructions", () => {
		const renderer = renderCookingMode();

		act(() => findButton(renderer, "Next step").props.onClick());
		expect(findText(renderer, "Step 2 of 2")).toBeTruthy();

		act(() => {
			renderer.update(
				<CookingMode
					recipe={{
						recipe_id: 43,
						recipe_name: "Quick Toast",
						instructions: ["Toast the bread."],
					}}
					onExit={vi.fn()}
				/>
			);
		});

		expect(findText(renderer, "Step 1 of 1")).toBeTruthy();
		expect(findText(renderer, "Toast the bread.")).toBeTruthy();
	});

	it("shows a usable empty state and still offers Exit cooking", () => {
		const onExit = vi.fn();
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<CookingMode recipe={{ ...recipe, instructions: [] }} onExit={onExit} />
			);
		});

		expect(findByRole(renderer, "status").children).toEqual([
			"This recipe does not have any cooking steps yet.",
		]);
		act(() => findButton(renderer, "Exit cooking").props.onClick());
		expect(onExit).toHaveBeenCalledTimes(1);
	});
});
