import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import Button from "./Button";

const renderButton = (element: React.ReactElement): ReactTestRenderer => {
	let renderer: ReactTestRenderer | undefined;
	act(() => {
		renderer = TestRenderer.create(element);
	});
	if (!renderer) throw new Error("The button renderer was not created.");
	return renderer;
};

describe("Button", () => {
	it("defaults to an accessible primary button and merges classes", () => {
		const renderer = renderButton(
			<Button className="custom-action">Save recipe</Button>,
		);

		const button = renderer.root.findByType("button");
		expect(button.props.type).toBe("button");
		expect(button.props["data-slot"]).toBe("button");
		expect(button.props.className).toContain("bg-primary");
		expect(button.props.className).toContain("custom-action");
	});

	it("supports destructive styling and rendering through Slot", () => {
		const renderer = renderButton(
			<Button asChild variant="destructive" size="sm">
				<a href="/remove">Remove</a>
			</Button>,
		);

		const link = renderer.root.findByType("a");
		expect(link.props.href).toBe("/remove");
		expect(link.props.className).toContain("bg-destructive");
		expect(link.props.className).toContain("h-11");
	});
});
