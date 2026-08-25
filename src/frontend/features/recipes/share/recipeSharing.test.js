import { describe, expect, it, vi } from "vitest";
import { buildRecipeShareUrl, shareRecipe } from "./recipeSharing";

describe("buildRecipeShareUrl", () => {
	it("builds the canonical recipe URL and encodes the recipe id", () => {
		expect(buildRecipeShareUrl("42", "https://recipes.example/app")).toBe(
			"https://recipes.example/recipe?id=42",
		);
		expect(buildRecipeShareUrl("42/seasonal specials", "https://recipes.example")).toBe(
			"https://recipes.example/recipe?id=42%2Fseasonal%20specials",
		);
	});
});

describe("shareRecipe", () => {
	it("uses the native Web Share API first", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		const browser = { navigator: { share, clipboard: { writeText: vi.fn() } } };

		expect(await shareRecipe({ title: "Pasta", text: "Try this", url: "https://example.test/recipe?id=42" }, browser)).toBe(
			"shared",
		);
		expect(share).toHaveBeenCalledWith({
			title: "Pasta",
			text: "Try this",
			url: "https://example.test/recipe?id=42",
		});
	});

	it("falls back to copying the URL", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		const browser = { navigator: { clipboard: { writeText } } };

		expect(await shareRecipe({ title: "Pasta", text: "Try this", url: "https://example.test/recipe?id=42" }, browser)).toBe(
			"copied",
		);
		expect(writeText).toHaveBeenCalledWith("https://example.test/recipe?id=42");
	});

	it("reports unavailable sharing APIs", async () => {
		await expect(shareRecipe({ title: "Pasta", text: "Try this", url: "https://example.test/recipe?id=42" }, { navigator: {} })).rejects.toThrow(
			"SHARE_UNAVAILABLE",
		);
	});

	it("quietly handles user cancellation", async () => {
		const error = new DOMException("The share was canceled", "AbortError");
		const browser = { navigator: { share: vi.fn().mockRejectedValue(error) } };

		expect(await shareRecipe({ title: "Pasta", text: "Try this", url: "https://example.test/recipe?id=42" }, browser)).toBe(
			"cancelled",
		);
	});

	it("preserves other browser rejections for actionable error handling", async () => {
		const error = new Error("Permission denied");
		const browser = { navigator: { share: vi.fn().mockRejectedValue(error) } };

		await expect(shareRecipe({ title: "Pasta", text: "Try this", url: "https://example.test/recipe?id=42" }, browser)).rejects.toBe(error);
	});
});
