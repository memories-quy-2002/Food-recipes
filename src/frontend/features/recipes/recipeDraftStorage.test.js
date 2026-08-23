// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
	clearRecipeDraft,
	getRecipeDraftStorageKey,
	loadRecipeDraft,
	parseRecipeDraft,
	saveRecipeDraft,
	serializeRecipeDraft,
} from "./recipeDraftStorage";

const recipe = {
	recipeImage: new File(["image"], "recipe.png", { type: "image/png" }),
	recipeName: "Soup",
	recipeCategoryName: "Dinner",
	recipeMealName: "Main course",
	recipeDescription: "Warm and quick",
	recipeIngredients: ["water"],
	recipeInstructions: ["Boil"],
	recipePrepTime: { number: "10", unit: "minutes" },
	recipeCookTime: { number: "20", unit: "minutes" },
	userId: 42,
};

describe("recipe draft storage", () => {
	beforeEach(() => localStorage.clear());

	it("serializes only non-sensitive recipe fields and excludes the image file and user id", () => {
		const serialized = serializeRecipeDraft(recipe, 123);

		expect(serialized).toMatchObject({ version: 1, userId: "123" });
		expect(serialized.form).toEqual({
			recipeImage: null,
			recipeName: "Soup",
			recipeCategoryName: "Dinner",
			recipeMealName: "Main course",
			recipeDescription: "Warm and quick",
			recipeIngredients: ["water"],
			recipeInstructions: ["Boil"],
			recipePrepTime: { number: "10", unit: "minutes" },
			recipeCookTime: { number: "20", unit: "minutes" },
		});
		expect(JSON.stringify(serialized)).not.toContain("jwt");
	});

	it("saves, loads, and clears a user-scoped draft", () => {
		saveRecipeDraft(localStorage, 42, recipe, 1000);

		expect(localStorage.getItem(getRecipeDraftStorageKey(42))).toBeTruthy();
		expect(loadRecipeDraft(localStorage, 42)).toMatchObject({
		version: 1,
		userId: "42",
		savedAt: 1000,
		form: { recipeName: "Soup", recipeImage: null },
	});

		clearRecipeDraft(localStorage, 42);
		expect(loadRecipeDraft(localStorage, 42)).toBeNull();
	});

	it("rejects corrupted or unsafe stored drafts and removes them", () => {
		const key = getRecipeDraftStorageKey(42);
		localStorage.setItem(key, "not-json");
		expect(loadRecipeDraft(localStorage, 42)).toBeNull();
		expect(localStorage.getItem(key)).toBeNull();

		localStorage.setItem(key, JSON.stringify({ version: 1, userId: "99", form: {} }));
		expect(loadRecipeDraft(localStorage, 42)).toBeNull();

		localStorage.setItem(key, JSON.stringify({
			version: 1,
			userId: "42",
			savedAt: 1000,
			form: { recipeIngredients: { unsafe: true } },
		}));
		expect(loadRecipeDraft(localStorage, 42)).toBeNull();
	});

	it("parses a valid draft without accepting arbitrary stored fields", () => {
		const parsed = parseRecipeDraft(JSON.stringify({
			version: 1,
			userId: "42",
			savedAt: 1000,
			form: {
				recipeName: "Soup",
				recipeCategoryName: "",
				recipeMealName: "",
				recipeDescription: "",
				recipeIngredients: [""],
				recipeInstructions: [""],
				recipePrepTime: { number: 15, unit: "minutes" },
				recipeCookTime: { number: 30, unit: "minutes" },
				token: "secret",
			},
		}));

		expect(parsed.form).toMatchObject({ recipeName: "Soup", recipeImage: null });
		expect(parsed.form.token).toBeUndefined();
	});
});
