import { describe, expect, it } from "vitest";
import { createRecipeFormSchema } from "./recipeForm.schema";

const taxonomy = {
	categories: [{ id: 1, name: "Dinner" }],
	meals: [{ id: 2, name: "Main course" }],
};

const validValues = {
	recipeName: "One-pan dinner",
	recipeCategoryName: "Dinner",
	recipeMealName: "Main course",
	recipeDescription: "A simple meal.",
	recipeIngredients: ["chicken"],
	recipeInstructions: ["Bake until cooked."],
	recipePrepTime: { number: "15", unit: "minutes" },
	recipeCookTime: { number: "30", unit: "minutes" },
	recipeImage: null,
};

describe("recipe form schema", () => {
	it("requires one meaningful ingredient and instruction", () => {
		expect(
			createRecipeFormSchema(taxonomy).safeParse({
				...validValues,
				recipeIngredients: [" ", ""],
				recipeInstructions: ["\t"],
			}).success
		).toBe(false);
	});

	it("rejects taxonomy values outside the loaded catalogs", () => {
		const result = createRecipeFormSchema(taxonomy).safeParse({
			...validValues,
			recipeCategoryName: "Other",
			recipeMealName: "Custom meal",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map(({ message }) => message)).toEqual([
				"Choose a supported category.",
				"Choose a supported meal.",
			]);
		}
	});

	it("requires finite positive durations with supported units", () => {
		const result = createRecipeFormSchema(taxonomy).safeParse({
			...validValues,
			recipePrepTime: { number: "0", unit: "minutes" },
			recipeCookTime: { number: "not-a-number", unit: "minutes" },
		});

		expect(result.success).toBe(false);
	});

	it("requires a valid image for publish but allows drafts without one", () => {
		expect(
			createRecipeFormSchema({ ...taxonomy, isPublishing: true }).safeParse(validValues).success
		).toBe(false);
		expect(
			createRecipeFormSchema({ ...taxonomy, isPublishing: true }).safeParse({
				...validValues,
				recipeImage: { type: "text/plain" },
			}).success
		).toBe(false);
		expect(
			createRecipeFormSchema({ ...taxonomy, isPublishing: false }).safeParse(validValues).success
		).toBe(true);
	});
});
