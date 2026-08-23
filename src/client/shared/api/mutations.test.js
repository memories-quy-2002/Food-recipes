import { describe, expect, it } from "vitest";
import { apiTargets } from "./config";
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

describe("Nest mutation compatibility", () => {
	it("serializes wishlist mutations to recipeId for Nest and preserves legacy fields", () => {
		expect(serializeWishlistPayload(apiTargets.NEST, 9, 15)).toEqual({
			recipeId: 15,
		});
		expect(serializeWishlistPayload(apiTargets.LEGACY, 9, 15)).toEqual({
			user_id: 9,
			recipe_id: 15,
		});
	});

	it("serializes the existing recipe form into the Nest DTO", () => {
		expect(
			serializeCreateRecipePayload(apiTargets.NEST, {
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

	it("keeps the legacy recipe payload unchanged", () => {
		expect(
			serializeCreateRecipePayload(apiTargets.LEGACY, {
				recipe: recipeForm,
				categories: [],
				meals: [],
				imageUrl: "https://images.test/pasta.jpg",
			})
		).toEqual({
			...recipeForm,
			recipeImage: undefined,
			imageUrl: "https://images.test/pasta.jpg",
		});
	});

	it("accepts Nest mutation statuses without changing legacy statuses", () => {
		expect(isWishlistAddSuccess(apiTargets.NEST, 201)).toBe(true);
		expect(isWishlistAddSuccess(apiTargets.NEST, 200)).toBe(false);
		expect(isWishlistAddSuccess(apiTargets.LEGACY, 200)).toBe(true);
		expect(isRecipeCreateSuccess(apiTargets.NEST, 201)).toBe(true);
		expect(isRecipeCreateSuccess(apiTargets.LEGACY, 200)).toBe(true);
		expect(isRecipeDeleteSuccess(apiTargets.NEST, 204)).toBe(true);
		expect(isRecipeDeleteSuccess(apiTargets.LEGACY, 200)).toBe(true);
	});

	it("serializes profile updates and unwraps each API response shape", () => {
		const profile = { name: "Ada", phoneNumber: "123", address: "London" };

		expect(serializeProfilePayload(apiTargets.NEST, profile)).toEqual(profile);
		expect(serializeProfilePayload(apiTargets.LEGACY, profile)).toEqual({
			formData: profile,
		});
		expect(getUpdatedProfileUser(apiTargets.NEST, profile)).toEqual(profile);
		expect(getUpdatedProfileUser(apiTargets.LEGACY, { user: profile })).toEqual(
			profile
		);
	});
});
