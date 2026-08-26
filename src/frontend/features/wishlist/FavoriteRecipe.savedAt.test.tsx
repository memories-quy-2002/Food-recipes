import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import FavoriteRecipe from "./FavoriteRecipe";

const recipe = {
	recipe_id: 3,
	recipe_name: "Tomato soup",
	category_name: "Dinner",
	meal_name: "Main course",
	overall_score: 4.5,
	num_ratings: 2,
};

describe("FavoriteRecipe saved metadata", () => {
	it("renders the backend save date when supplied", () => {
		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<FavoriteRecipe
						recipe={recipe}
						savedAt="2026-08-23T10:00:00.000Z"
						handleShowModal={vi.fn()}
					/>
				</MemoryRouter>
			);
		});

		expect(renderer.root.findByProps({ className: "wishlist__main__content__list__item__saved-at" }).children.join("")).toContain("Saved");
	});

	it("truthfully labels entries without a save date", () => {
		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<FavoriteRecipe recipe={recipe} handleShowModal={vi.fn()} />
				</MemoryRouter>
			);
		});

		expect(renderer.root.findByProps({ className: "wishlist__main__content__list__item__saved-at" }).children).toEqual(["Saved date unavailable"]);
	});
});
