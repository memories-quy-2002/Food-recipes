// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ToastViewport from "./ToastViewport";

describe("ToastViewport", () => {
	it("positions notifications below the responsive header", () => {
		render(
			<ToastViewport
				toasts={[{ id: "toast-1", title: "Saved", message: "Recipe saved.", type: "success" }]}
				onDismiss={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("Notifications")).toHaveClass(
			"top-20",
			"sm:top-[5.5rem]",
			"lg:top-[6.5rem]",
		);
	});
});
