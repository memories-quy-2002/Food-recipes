import { beforeEach, describe, expect, it } from "vitest";
import {
	beginAuthIntent,
	clearAuthIntent,
	consumeAuthIntent,
	isSafeInternalPath,
	isMatchingSaveRecipeIntent,
} from "./returnIntent";

describe("authentication return intent", () => {
	beforeEach(() => {
		const values = new Map();
		globalThis.window = {
			location: { origin: "http://localhost" },
			sessionStorage: {
				getItem: (key) => values.get(key) ?? null,
				setItem: (key, value) => values.set(key, value),
				removeItem: (key) => values.delete(key),
				clear: () => values.clear(),
			},
		};
	});

	it("accepts same-origin internal paths and rejects external targets", () => {
		expect(isSafeInternalPath("/recipe?id=7")).toBe(true);
		expect(isSafeInternalPath("/?q=pasta&categories=2")).toBe(true);
		expect(isSafeInternalPath("https://attacker.example/steal")).toBe(false);
		expect(isSafeInternalPath("//attacker.example/steal")).toBe(false);
		expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
	});

	it("stores a narrow save intent and consumes it only once", () => {
		beginAuthIntent({
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: 7,
		});

		expect(consumeAuthIntent()).toEqual({
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: "7",
		});
		expect(consumeAuthIntent()).toBeNull();
	});

	it("clears malformed or explicitly cleared intents", () => {
		window.sessionStorage.setItem("food-recipes:auth-intent", "not-json");
		expect(consumeAuthIntent()).toBeNull();

		beginAuthIntent({ returnTo: "/food?categories=2" });
		clearAuthIntent();
		expect(consumeAuthIntent()).toBeNull();
	});

	it("matches a save intent to both the current path and recipe", () => {
		const intent = {
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: "7",
		};

		expect(isMatchingSaveRecipeIntent(intent, "/recipe?id=7", 7)).toBe(true);
		expect(isMatchingSaveRecipeIntent(intent, "/recipe?id=8", 7)).toBe(false);
		expect(isMatchingSaveRecipeIntent(intent, "/", 7)).toBe(false);
	});
});
