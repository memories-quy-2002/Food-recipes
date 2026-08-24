import { describe, expect, it } from "vitest";
import {
	consolidateStructuredIngredients,
	formatStructuredIngredient,
	scaleStructuredIngredient,
} from "./structuredIngredients";

describe("structured ingredients", () => {
	it("scales numeric quantities while preserving notes", () => {
		expect(
			formatStructuredIngredient(
				scaleStructuredIngredient(
					{ name: "chicken breast", quantity: 500, unit: "GRAM", note: "diced" },
					8,
					4,
				),
			),
		).toBe("1000 g chicken breast, diced");
	});

	it("does not scale nonnumeric quantities", () => {
		const ingredient = { name: "salt", note: "to taste" };
		expect(scaleStructuredIngredient(ingredient, 8, 4)).toEqual(ingredient);
	});

	it("consolidates compatible units and keeps incompatible items separate", () => {
		expect(
			consolidateStructuredIngredients([
				{ name: "eggs", quantity: 2, unit: "PIECE" },
				{ name: "eggs", quantity: 3, unit: "PIECE" },
				{ name: "flour", quantity: 500, unit: "GRAM" },
				{ name: "flour", quantity: 1, unit: "KILOGRAM" },
				{ name: "flour", quantity: 1, unit: "CUP" },
			]),
		).toEqual([
			{ name: "eggs", quantity: 5, unit: "PIECE" },
			{ name: "flour", quantity: 1500, unit: "GRAM" },
			{ name: "flour", quantity: 1, unit: "CUP" },
		]);
	});
});
