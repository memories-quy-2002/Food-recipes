import { describe, expect, it } from "vitest";
import { isShoppingItemInPantry } from "./shoppingAvailability";

describe("isShoppingItemInPantry", () => {
	it("matches an ingredient name inside a quantity label", () => {
		expect(isShoppingItemInPantry("2 cups spinach", ["Spinach"])).toBe(true);
	});

	it("ignores unavailable pantry items and very short names", () => {
		expect(isShoppingItemInPantry("1 kg rice", ["rice"])).toBe(true);
		expect(isShoppingItemInPantry("oil", ["oil"])).toBe(true);
		expect(isShoppingItemInPantry("1 egg", ["an"])).toBe(false);
	});

	it("does not match unrelated labels", () => {
		expect(isShoppingItemInPantry("coconut milk", ["coconut"])).toBe(true);
		expect(isShoppingItemInPantry("tomatoes", ["potato"])).toBe(false);
	});
});
