import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CategorySection, { rankCategories } from "./CategorySection";

const categories = (items) => items.map(([id, name, recipe_count]) => ({ id, name, recipe_count }));

describe("Home category ranking", () => {
	it("uses recipe popularity instead of API/database order", () => {
		const ranked = rankCategories(
			categories([
				[99, "Salads", 2],
				[1, "Chicken", 12],
				[50, "Pizza", 7],
			])
		);

		expect(ranked.map(({ name }) => name)).toEqual(["Chicken", "Pizza", "Salads"]);
	});

	it("uses curated taxonomy order when popularity is unavailable", () => {
		const ranked = rankCategories(
			categories([
				[99, "Salads"],
				[1, "Chicken"],
				[50, "Pizza"],
			])
		);

		expect(ranked.map(({ name }) => name)).toEqual(["Chicken", "Pizza", "Salads"]);
	});

	it("renders All categories first and only the five highest-ranked categories", () => {
		let renderer;
		act(() => {
				renderer = TestRenderer.create(
					<MemoryRouter>
						<CategorySection
						categories={categories([
						[1, "Salads", 2],
						[2, "Chicken", 12],
						[3, "Pizza", 7],
						[4, "Soups", 6],
						[5, "Desserts", 5],
						[6, "Pasta dishes", 4],
					])}
					selectedCategoryId="all"
						onCategorySelect={vi.fn()}
						/>
					</MemoryRouter>
				);
		});

		expect(renderer.root.findAllByType("h4").map(({ children }) => children.join(""))).toEqual([
			"All categories",
			"Chicken",
			"Pizza",
			"Soups",
			"Desserts",
			"Pasta dishes",
		]);
	});
});
