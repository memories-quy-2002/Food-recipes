// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { validateRecipeForm } from "./AddRecipe";

const supportedTaxonomy = {

	categories: [{ id: 1, name: "Dinner" }],

	meals: [{ id: 2, name: "Main course" }],

};

const validRecipe = {

	recipeName: "  One-pan dinner  ",

	recipeDescription: "A simple meal.",

	recipeCategoryName: "Dinner",

	recipeMealName: "Main course",

	recipeIngredients: ["  chicken  ", "   "],

	recipeInstructions: ["  Bake until cooked.  ", ""],

	recipePrepTime: { number: "15", unit: "minutes" },

	recipeCookTime: { number: "30", unit: "minutes" },

	recipeImage: { type: "image/jpeg" },

};

describe("recipe creation business rules", () => {

	it("accepts one meaningful ingredient and instruction after trimming empty rows", () => {

		expect(validateRecipeForm(validRecipe, supportedTaxonomy)).toEqual({

			errors: [],

		});

	});

	it("rejects whitespace-only names, taxonomy, ingredients, and instructions", () => {

		const result = validateRecipeForm(

			{

				...validRecipe,

				recipeName: "  ",

				recipeCategoryName: "",

				recipeMealName: " ",

				recipeIngredients: [" ", ""],

				recipeInstructions: ["\t"],

			},

			supportedTaxonomy

		);


		expect(result.errors).toEqual([

			"Recipe name is required.",

			"Choose a supported category.",

			"Choose a supported meal.",

			"Add at least one ingredient.",

			"Add at least one instruction.",

		]);

	});

	it("rejects unknown taxonomy values instead of allowing Other values", () => {

		const result = validateRecipeForm(

			{

				...validRecipe,

				recipeCategoryName: "Other",

				recipeMealName: "Custom meal",

			},

			supportedTaxonomy

		);


		expect(result.errors).toEqual([

			"Choose a supported category.",

			"Choose a supported meal.",

		]);

	});

	it("requires finite positive durations with supported units", () => {

		const result = validateRecipeForm(

			{

				...validRecipe,

				recipePrepTime: { number: "0", unit: "minutes" },

				recipeCookTime: { number: "not-a-number", unit: "minutes" },

			},

			supportedTaxonomy

		);


		expect(result.errors).toEqual([

			"Preparation time must be a positive number.",

			"Cooking time must be a positive number.",

		]);

	});

	it("requires a valid image only when publishing", () => {

		expect(

			validateRecipeForm(

				{ ...validRecipe, recipeImage: null },

				{ ...supportedTaxonomy, isPublishing: true }

			).errors

		).toEqual(["Choose a recipe image before publishing."]);

		expect(

			validateRecipeForm(

				{ ...validRecipe, recipeImage: { type: "text/plain" } },

				{ ...supportedTaxonomy, isPublishing: true }

			).errors

		).toEqual(["Choose a valid recipe image before publishing."]);

		expect(

			validateRecipeForm(

				{ ...validRecipe, recipeImage: null },

				{ ...supportedTaxonomy, isPublishing: false }

			).errors

		).toEqual([]);

	});

	it("allows an incomplete draft while keeping publish validation strict", () => {
		expect(
			validateRecipeForm(
				{ recipeName: "Work in progress", recipeImage: null },
				{ ...supportedTaxonomy, isPublishing: false }
			).errors
		).toEqual([
			"Choose a supported category.",
			"Choose a supported meal.",
			"Add at least one ingredient.",
			"Add at least one instruction.",
			"Preparation time must be a positive number.",
			"Cooking time must be a positive number.",
		]);
	});
});
