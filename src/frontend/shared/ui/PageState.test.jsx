import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import PageState from "./PageState";

describe("PageState action", () => {
	it("renders the shared Button and invokes the supplied action", () => {
		const onAction = vi.fn();
		let renderer;

		act(() => {
			renderer = TestRenderer.create(
				<PageState
					type="error"
					title="Could not load"
					actionLabel="Try again"
					onAction={onAction}
				/>
			);
		});

		const button = renderer.root.findByType("button");
		expect(button.props["data-slot"]).toBe("button");
		act(() => button.props.onClick());
		expect(onAction).toHaveBeenCalledOnce();
	});
});
