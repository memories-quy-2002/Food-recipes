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

	it("does not use the other taxonomy field as a catalog fallback", () => {
		const categoryUsesMealField = createRecipeFormSchema({
			categories: [{ id: 1, meal_name: "Main course" }],
			meals: [{ id: 2, category_name: "Dinner" }],
		}).safeParse({
			...validValues,
			recipeCategoryName: "Main course",
			recipeMealName: "Dinner",
		});

		expect(categoryUsesMealField.success).toBe(false);
		if (!categoryUsesMealField.success) {
			expect(categoryUsesMealField.error.issues.map(({ path }) => path.join("."))).toEqual([
				"recipeCategoryName",
				"recipeMealName",
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
			createRecipeFormSchema({ ...taxonomy, isPublishing: true }).safeParse({
				...validValues,
				recipeImage: { type: "image/" },
			}).success
		).toBe(false);
		expect(
			createRecipeFormSchema({ ...taxonomy, isPublishing: false }).safeParse(validValues).success
		).toBe(true);
	});

	it("accepts structured ingredients as the ingredient source and validates manual nutrition", () => {
		const result = createRecipeFormSchema({ ...taxonomy, isPublishing: true }).safeParse({
			...validValues,
			recipeIngredients: [""],
			recipeImage: { type: "image/jpeg" },
			structuredIngredients: [{ quantityText: "1", unit: "cup", name: "flour", preparation: "sifted" }],
			nutrition: { servings: "2", calories: "100", protein: "3", carbohydrates: "10", fat: "2", fiber: "1", sugar: "2", sodium: "20" },
			dietaryTags: ["vegetarian"],
			allergenTags: ["wheat"],
		});

		expect(result.success).toBe(true);
	});

	it("rejects ambiguous quantities and unsupported units before publishing", () => {
		const result = createRecipeFormSchema({ ...taxonomy, isPublishing: true }).safeParse({
			...validValues,
			recipeIngredients: [""],
			recipeImage: { type: "image/jpeg" },
			structuredIngredients: [{ quantityText: "a little", unit: "handful", name: "salt", preparation: "" }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects structured rows without names and negative nutrition values", () => {
		const result = createRecipeFormSchema(taxonomy).safeParse({
			...validValues,
			recipeIngredients: [""],
			structuredIngredients: [{ quantityText: "1", unit: "cup", name: "", preparation: "" }],
			nutrition: { servings: "2", calories: "-1" },
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map(({ message }) => message)).toEqual(
				expect.arrayContaining(["Add at least one ingredient.", "Ingredient name is required.", "Nutrition values must be zero or greater."])
			);
		}
	});
});
