// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readRecipeSource = (fileName) =>
	readFileSync(path.resolve(process.cwd(), "features", "recipes", fileName), "utf8");

describe("recipe print layout", () => {
	it("marks interactive and unrelated recipe areas for exclusion while preserving recipe details", () => {
		const recipeSource = readRecipeSource("Recipe.jsx");

		expect(recipeSource).toContain('className="recipe-print');
		expect(recipeSource).toMatch(/className="recipe-print__dialogs"\s+data-print-hidden/);
		expect(recipeSource).toMatch(/className="recipe-print__private-notes"\s+data-print-hidden/);
		expect(recipeSource).toMatch(/className="recipe-print__related"\s+data-print-hidden/);
		expect(recipeSource).toContain("<RecipeContainerSummary");
		expect(recipeSource).toContain("<RecipeContent");
	});

	it("hides chrome and keeps printable recipe content together", () => {
		const printStyles = readRecipeSource("Recipe.print.scss");

		expect(printStyles).toContain("@media print");
		expect(printStyles).toMatch(/:is\(header,\s*footer,\s*nav\)/);
		expect(printStyles).toMatch(/\[data-print-hidden\]/);
		expect(printStyles).toMatch(/\.recipe-print__summary\s+:is\(button,\s*a\)/);
		expect(printStyles).toMatch(/suggestion-panel-title/);
		expect(printStyles).toMatch(/recipe-reviews-title/);
		expect(printStyles).toMatch(/break-inside:\s*avoid/);
		expect(printStyles).toMatch(/h1,\s*h2,\s*h3/);
	});
});
