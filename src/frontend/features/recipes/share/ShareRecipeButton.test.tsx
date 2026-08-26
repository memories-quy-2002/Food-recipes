// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareRecipeButton from "./ShareRecipeButton";
import { shareRecipe } from "./recipeSharing";
import type { ShareResult } from "./recipeSharing";

const showToast = vi.fn();
const mockedShareRecipe = vi.mocked(shareRecipe);

vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast }),
}));

vi.mock("./recipeSharing", async (importOriginal) => ({
	...(await importOriginal()),
	shareRecipe: vi.fn(),
}));

const renderButton = () => render(
	<ShareRecipeButton
		recipeId="42"
		recipeName="Summer Pasta"
		description="A bright pasta dinner."
	/>,
);

describe("ShareRecipeButton", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("exposes an accessible share recipe button", () => {
		renderButton();
		const button = screen.getByRole("button", { name: "Share recipe" });
		expect(button).toBeEnabled();
		expect(button).toHaveClass("h-11");
	});

	it("shows a pending state and prevents repeated requests", async () => {
		let resolveShare: (result: ShareResult | PromiseLike<ShareResult>) => void = () => undefined;
		mockedShareRecipe.mockReturnValue(new Promise((resolve) => { resolveShare = resolve; }));
		renderButton();

		const button = screen.getByRole("button", { name: "Share recipe" });
		fireEvent.click(button);
		fireEvent.click(button);

		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
		expect(shareRecipe).toHaveBeenCalledOnce();
		resolveShare("shared");
		await waitFor(() => expect(button).toBeEnabled());
	});

	it("announces successful native sharing", async () => {
		mockedShareRecipe.mockResolvedValue("shared");
		renderButton();
		fireEvent.click(screen.getByRole("button", { name: "Share recipe" }));

		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Recipe shared."));
		expect(showToast).toHaveBeenCalledWith({ title: "Recipe shared" });
	});

	it("announces the clipboard fallback", async () => {
		mockedShareRecipe.mockResolvedValue("copied");
		renderButton();
		fireEvent.click(screen.getByRole("button", { name: "Share recipe" }));

		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Recipe link copied to clipboard."));
		expect(shareRecipe).toHaveBeenCalledWith({
		title: "Summer Pasta",
		text: "A bright pasta dinner.",
		url: "http://localhost:3000/recipe?id=42",
	});
	});

	it("announces when sharing is unsupported", async () => {
		mockedShareRecipe.mockRejectedValue(new Error("SHARE_UNAVAILABLE"));
		renderButton();
		fireEvent.click(screen.getByRole("button", { name: "Share recipe" }));

		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sharing isn't available in this browser."));
		expect(showToast).toHaveBeenCalledWith({
			title: "Sharing isn't available in this browser.",
			type: "error",
		});
	});
});
