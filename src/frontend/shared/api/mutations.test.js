import { describe, expect, it } from "vitest";
import {
	getUpdatedProfileUser,
	isRecipeCreateSuccess,
	isRecipeDeleteSuccess,
	isWishlistAddSuccess,
	serializeCreateRecipePayload,
	serializeProfilePayload,
	serializeWishlistPayload,
} from "./mutations";

const recipeForm = {
	recipeName: "  Pasta  ",
	recipeDescription: "  Weeknight dinner  ",
	recipeCategoryName: "Pasta",
	recipeMealName: "Dinner",
	recipePrepTime: { number: "2", unit: "hours" },
	recipeCookTime: { number: "30", unit: "minutes" },
	recipeIngredients: ["noodles"],
	recipeInstructions: ["boil"],
	userId: 9,
};

	describe("Nest mutation contracts", () => {
	it("serializes wishlist mutations to recipeId", () => {
		expect(serializeWishlistPayload(15)).toEqual({
			recipeId: 15,
		});
	});

	it("serializes the existing recipe form into the Nest DTO", () => {
		expect(
			serializeCreateRecipePayload({
				recipe: recipeForm,
				categories: [{ id: 8, name: "Pasta" }],
				meals: [{ id: 3, name: "Dinner" }],
				imageUrl: "https://images.test/pasta.jpg",
			})
		).toEqual({
			name: "Pasta",
			description: "  Weeknight dinner  ",
			mealId: 3,
			categoryId: 8,
			prepTimeMinutes: 120,
			cookTimeMinutes: 30,
			ingredients: ["noodles"],
			instructions: ["boil"],
			imageUrl: "https://images.test/pasta.jpg",
		});
	});

	it("accepts Nest mutation statuses", () => {
		expect(isWishlistAddSuccess(201)).toBe(true);
		expect(isWishlistAddSuccess(200)).toBe(false);
		expect(isRecipeCreateSuccess(201)).toBe(true);
		expect(isRecipeDeleteSuccess(204)).toBe(true);
		expect(isRecipeDeleteSuccess(200)).toBe(false);
	});

	it("serializes profile updates and unwraps each API response shape", () => {
		const profile = { name: "Ada", phoneNumber: "123", address: "London" };

		expect(serializeProfilePayload(profile)).toEqual(profile);
		expect(getUpdatedProfileUser(profile)).toEqual(profile);
	});
});
