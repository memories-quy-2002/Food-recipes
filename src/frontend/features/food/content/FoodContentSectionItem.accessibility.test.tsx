import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Link, MemoryRouter } from "react-router-dom";
import FoodContentSectionItem from "./FoodContentSectionItem";

describe("FoodContentSectionItem semantics", () => {
	it("uses a native router Link for keyboard recipe navigation", () => {
		let renderer!: ReactTestRenderer;

		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<FoodContentSectionItem
						recipe={{
							recipe_id: 12,
							recipe_name: "Mushroom Risotto",
							recipe_description: null,
							date_added: null,
							image_url: null,
							prep_time_minutes: 10,
							cook_time_minutes: 20,
							total_time_minutes: 30,
							user_id: 1,
							category_name: "Dinner",
							meal_name: "Main course",
							overall_score: 4.2,
							num_ratings: 8,
						}}
					/>
				</MemoryRouter>
			);
		});

		const link = renderer.root.findByType(Link);
		const article = renderer.root.findByType("article");

		expect(link.props.to).toBe("/recipe?id=12");
		expect(link.props["aria-label"]).toBe("Open Mushroom Risotto");
		expect(article.props.role).toBeUndefined();
		expect(article.props.onKeyDown).toBeUndefined();
	});
});
