import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	beginAuthIntent,
	clearAuthIntent,
	clearAuthIntentIfUnchanged,
	consumeAuthIntent,
	getAuthReturnPath,
	isSafeInternalPath,
	isMatchingSaveRecipeIntent,
	isMatchingPrepareMealIntent,
	type AuthIntent,
} from "./returnIntent";

type MemoryStorage = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
};

const createStorage = (): MemoryStorage => {
	const values = new Map<string, string>();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
		clear: () => values.clear(),
	};
};

const originalWindow = globalThis.window;

beforeEach(() => {
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: {
			location: { origin: "http://localhost" },
			sessionStorage: createStorage(),
		},
	});
});

afterEach(() => {
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: originalWindow,
	});
});

describe("authentication return intent", () => {
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

	it("expires intents after the bounded auth-flow lifetime", () => {
		window.sessionStorage.setItem(
			"food-recipes:auth-intent",
			JSON.stringify({
				returnTo: "/recipe?id=7",
				createdAt: Date.now() - 11 * 60 * 1000,
			}),
		);

		expect(consumeAuthIntent()).toBeNull();
	});

	it("only clears the auth intent snapshot that the account flow entered with", () => {
		beginAuthIntent({ returnTo: "/recipe?id=7", action: "saveRecipe", recipeId: 7 });
		const original = window.sessionStorage.getItem("food-recipes:auth-intent");

		beginAuthIntent({ returnTo: "/food/add" });
		clearAuthIntentIfUnchanged(original);

		expect(consumeAuthIntent()).toEqual({ returnTo: "/food/add" });
	});

	it("clears malformed or explicitly cleared intents", () => {
		window.sessionStorage.setItem("food-recipes:auth-intent", "not-json");
		expect(consumeAuthIntent()).toBeNull();

		beginAuthIntent({ returnTo: "/food?categories=2" });
		clearAuthIntent();
		expect(consumeAuthIntent()).toBeNull();
	});

	it("matches a save intent to both the current path and recipe", () => {
		const intent: AuthIntent = {
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: "7",
		};

		expect(isMatchingSaveRecipeIntent(intent, "/recipe?id=7", 7)).toBe(true);
		expect(isMatchingSaveRecipeIntent(intent, "/recipe?id=8", 7)).toBe(false);
		expect(isMatchingSaveRecipeIntent(intent, "/", 7)).toBe(false);
	});

	it("returns only safe internal paths from router state", () => {
		expect(getAuthReturnPath({ state: { from: "/recipe?id=7" } })).toBe(
			"/recipe?id=7",
		);
		expect(getAuthReturnPath({ state: { from: "https://attacker.example" } })).toBe(
			"/",
		);
	});

	it("preserves a save-to-collection intent through authentication", () => {
		beginAuthIntent({
			returnTo: "/recipe?id=7",
			action: "saveToCollection",
			recipeId: 7,
		});

		expect(consumeAuthIntent()).toEqual({
			returnTo: "/recipe?id=7",
			action: "saveToCollection",
			recipeId: "7",
		});
	});

	it("preserves preparation intent so a guest can continue after signing in", () => {
		beginAuthIntent({ returnTo: "/recipe?id=7", action: "prepareMeal", recipeId: 7 });

		const intent = consumeAuthIntent();
		expect(intent).not.toBeNull();
		expect(isMatchingPrepareMealIntent(intent, "/recipe?id=7", 7)).toBe(true);
	});
});
