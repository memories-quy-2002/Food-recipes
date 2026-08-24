// @vitest-environment jsdom

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import ManualTimer from "./ManualTimer";

describe("ManualTimer", () => {
	it("supports start, pause, resume, and reset controls", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(<ManualTimer />);
		});

		const button = (name) => renderer.root.findAllByType("button").find((node) => node.children.join("") === name);
		expect(button("Start timer")).toBeTruthy();
		act(() => button("Start timer").props.onClick());
		expect(button("Pause timer")).toBeTruthy();
		act(() => button("Pause timer").props.onClick());
		expect(button("Resume timer")).toBeTruthy();
		act(() => button("Resume timer").props.onClick());
		act(() => button("Reset timer").props.onClick());
		expect(button("Start timer")).toBeTruthy();
	});
});
