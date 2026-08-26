import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import PageState from "./PageState";

const renderPageState = (element: React.ReactElement): ReactTestRenderer => {
	let renderer: ReactTestRenderer | undefined;
	act(() => {
		renderer = TestRenderer.create(element);
	});
	if (!renderer) throw new Error("The page state renderer was not created.");
	return renderer;
};

describe("PageState action", () => {
	it("renders the shared Button and invokes the supplied action", () => {
		const onAction = vi.fn();
		const renderer = renderPageState(
			<PageState
				type="error"
				title="Could not load"
				actionLabel="Try again"
				onAction={onAction}
			/>,
		);

		const button = renderer.root.findByType("button");
		expect(button.props["data-slot"]).toBe("button");
		const onClick = button.props.onClick;
		if (typeof onClick !== "function") {
			throw new Error("The page state action was not rendered.");
		}
		act(() => onClick());
		expect(onAction).toHaveBeenCalledOnce();
	});
});
