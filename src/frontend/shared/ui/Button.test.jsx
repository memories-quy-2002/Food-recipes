import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import Button from "./Button";

describe("Button", () => {
	it("defaults to an accessible primary button and merges classes", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<Button className="custom-action">Save recipe</Button>
			);
		});

		const button = renderer.root.findByType("button");
		expect(button.props.type).toBe("button");
		expect(button.props["data-slot"]).toBe("button");
		expect(button.props.className).toContain("bg-primary");
		expect(button.props.className).toContain("custom-action");
	});

	it("supports destructive styling and rendering through Slot", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<Button asChild variant="destructive" size="sm">
					<a href="/remove">Remove</a>
				</Button>
			);
		});

		const link = renderer.root.findByType("a");
		expect(link.props.href).toBe("/remove");
		expect(link.props.className).toContain("bg-destructive");
		expect(link.props.className).toContain("h-11");
	});
});
