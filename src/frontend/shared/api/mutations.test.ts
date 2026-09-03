import { describe, expect, it } from "vitest";
import {
	isRecipeCreateSuccess,
	isRecipeDeleteSuccess,
	isWishlistAddSuccess,
	serializeWishlistPayload,
} from "./mutations";

describe("Nest mutation contracts", () => {
	it("serializes wishlist mutations to recipeId", () => {
		expect(serializeWishlistPayload(15)).toEqual({
			recipeId: 15,
		});
	});

	it("accepts Nest mutation statuses", () => {
		expect(isWishlistAddSuccess(201)).toBe(true);
		expect(isWishlistAddSuccess(200)).toBe(false);
		expect(isRecipeCreateSuccess(201)).toBe(true);
		expect(isRecipeDeleteSuccess(204)).toBe(true);
		expect(isRecipeDeleteSuccess(200)).toBe(false);
	});

});
