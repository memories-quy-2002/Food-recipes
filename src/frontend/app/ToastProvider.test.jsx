// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider, { useToast } from "./ToastProvider";

const ToastTrigger = () => {
	const { showToast } = useToast();

	return (
		<div>
			<button
				type="button"
				onClick={() =>
					showToast({
						title: "Recipe saved",
						message: "You can find it in Saved.",
					})
				}
			>
				Show success
			</button>
			<button
				type="button"
				onClick={() =>
					showToast({
						title: "Could not save",
						message: "Please try again.",
						type: "error",
					})
				}
			>
				Show error
			</button>
		</div>
	);
};

describe("ToastProvider", () => {
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it("renders accessible success feedback with a message and dismiss action", () => {
		render(
			<ToastProvider>
				<ToastTrigger />
			</ToastProvider>
		);

		fireEvent.click(screen.getByRole("button", { name: "Show success" }));

		expect(screen.getByRole("status")).toHaveTextContent("Recipe saved");
		expect(screen.getByRole("status")).toHaveTextContent(
			"You can find it in Saved."
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Dismiss notification: Recipe saved",
			})
		);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("announces errors as alerts and auto-dismisses them after the readable duration", () => {
		vi.useFakeTimers();
		render(
			<ToastProvider>
				<ToastTrigger />
			</ToastProvider>
		);

		fireEvent.click(screen.getByRole("button", { name: "Show error" }));
		expect(screen.getByRole("alert")).toHaveTextContent("Could not save");

		act(() => vi.advanceTimersByTime(4999));
		expect(screen.getByRole("alert")).toBeInTheDocument();

		act(() => vi.advanceTimersByTime(1));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
