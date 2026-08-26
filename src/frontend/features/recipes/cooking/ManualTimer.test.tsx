// @vitest-environment jsdom

import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import ManualTimer from "./ManualTimer";

describe("ManualTimer", () => {
	it("supports start, pause, resume, and reset controls", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<ManualTimer />);
		});

		if (!renderer) throw new Error("ManualTimer renderer was not created");
		const currentRenderer = renderer;
		const button = (name: string): ReactTestInstance => {
			const matchingButton = currentRenderer.root
				.findAllByType("button")
				.find((node: ReactTestInstance) => node.props["aria-label"] === name);
			if (!matchingButton) throw new Error(`Button not found: ${name}`);
			return matchingButton;
		};
		const clickButton = (name: string): void => {
			const onClick = button(name).props["onClick"];
			if (typeof onClick !== "function") throw new Error(`Button is not clickable: ${name}`);
			act(() => onClick());
		};
		expect(button("Start timer")).toBeTruthy();
		clickButton("Start timer");
		expect(button("Pause timer")).toBeTruthy();
		clickButton("Pause timer");
		expect(button("Resume timer")).toBeTruthy();
		clickButton("Resume timer");
		clickButton("Reset timer");
		expect(button("Start timer")).toBeTruthy();
	});
});
