// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrintRecipeButton from "./PrintRecipeButton";

const showToast = vi.fn();

vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast }),
}));

describe("PrintRecipeButton", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("exposes an accessible print recipe button", () => {
		render(<PrintRecipeButton />);
		expect(screen.getByRole("button", { name: "Print recipe" })).toBeEnabled();
	});

	it("opens the print dialog only after activation", () => {
		const print = vi.spyOn(window, "print").mockImplementation(() => {});
		render(<PrintRecipeButton />);

		expect(print).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Print recipe" }));
		expect(print).toHaveBeenCalledOnce();
		expect(showToast).toHaveBeenCalledWith({ title: "Print dialog opened" });
		print.mockRestore();
	});
});
