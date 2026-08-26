import React from "react";
import TestRenderer, { act, type ReactTestChild, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
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

type CookingModeRenderProps = Partial<
	Pick<React.ComponentProps<typeof CookingMode>, "planningContext" | "onBackToPlan" | "initialStepIndex">
>;

const createRenderer = (element: React.ReactElement): ReactTestRenderer => {
	let renderer: ReactTestRenderer | undefined;
	act(() => {
		renderer = TestRenderer.create(element);
	});
	if (!renderer) throw new Error("CookingMode renderer was not created");
	return renderer;
};

const renderCookingMode = (props: CookingModeRenderProps = {}): ReactTestRenderer =>
	createRenderer(<CookingMode recipe={recipe} onExit={vi.fn()} {...props} />);

const getNodeText = (node: ReactTestInstance): string =>
	node.children
		.map((child: ReactTestChild) => typeof child === "string" ? child : getNodeText(child))
		.join("");

const findButton = (renderer: ReactTestRenderer, name: string): ReactTestInstance => {
	const button = renderer.root
		.findAllByType("button")
		.find((node: ReactTestInstance) => node.props["aria-label"] === name || getNodeText(node) === name);
	if (!button) throw new Error(`Button not found: ${name}`);
	return button;
};

const clickButton = (renderer: ReactTestRenderer, name: string): void => {
	const onClick = findButton(renderer, name).props["onClick"];
	if (typeof onClick !== "function") throw new Error(`Button is not clickable: ${name}`);
	act(() => onClick());
};

const findText = (renderer: ReactTestRenderer, text: string): ReactTestInstance | undefined =>
	renderer.root.findAll((node: ReactTestInstance) => node.children.join("") === text)[0];

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
		clickButton(renderer, "Next step");
		clickButton(renderer, "Finish cooking");
		expect(findText(renderer, "Recipe complete")).toBeTruthy();
		expect(findButton(renderer, "Back to plan")).toBeTruthy();
		clickButton(renderer, "Back to plan");
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

		const onNextClick = next.props["onClick"];
		if (typeof onNextClick !== "function") throw new Error("Next step button is not clickable");
		act(() => onNextClick());
		expect(findText(renderer, "Step 2 of 2")).toBeTruthy();
		expect(findText(renderer, recipe.instructions[1])).toBeTruthy();
		expect(findButton(renderer, "Next step").props.disabled).toBe(true);
		expect(findButton(renderer, "Finish cooking")).toBeTruthy();

		const mode = renderer.root.findByType("main");
		const onKeyDown = mode.props["onKeyDown"];
		if (typeof onKeyDown !== "function") throw new Error("Cooking mode does not handle keyboard input");
		act(() => onKeyDown({ key: "ArrowLeft", preventDefault: vi.fn() }));
		expect(findText(renderer, "Step 1 of 2")).toBeTruthy();
	});

	it("resets the step when the recipe changes to fewer instructions", () => {
		const renderer = renderCookingMode();

		clickButton(renderer, "Next step");
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

	it("starts on the server-restored step", () => {
		const renderer = renderCookingMode({ initialStepIndex: 1 });

		expect(findText(renderer, "Step 2 of 2")).toBeTruthy();
		expect(findText(renderer, recipe.instructions[1])).toBeTruthy();
	});

	it("shows a usable empty state and still offers Exit cooking", async () => {
		const onExit = vi.fn();
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<CookingMode recipe={{ ...recipe, instructions: [] }} onExit={onExit} />
			);
		});
		if (!renderer) throw new Error("CookingMode renderer was not created");
		const currentRenderer = renderer;

		expect(findText(currentRenderer, "This recipe does not have any instructions to guide you through.")).toBeTruthy();
		await act(async () => {
			const onClick = findButton(currentRenderer, "Pause and exit cooking").props["onClick"];
			if (typeof onClick !== "function") throw new Error("Pause and exit button is not clickable");
			onClick();
			await Promise.resolve();
		});
		expect(onExit).toHaveBeenCalledTimes(1);
	});
});
