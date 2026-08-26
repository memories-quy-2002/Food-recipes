import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeContainerSummary from "./RecipeContainerSummary";

const recipe = {
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	category_name: "Dinner",
	meal_name: "Main course",
	overall_score: 4.5,
	num_ratings: 12,
	full_name: "Ava Cook",
};

describe("RecipeContainerSummary planning action", () => {
	it("exposes Add to plan and forwards the action", () => {
		const onAddToPlan = vi.fn();
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={false}
						onClickFavorite={vi.fn()}
						onAddToPlan={onAddToPlan}
					/>
				</MemoryRouter>,
			);
		});
		if (!renderer) throw new Error("Expected the recipe summary renderer");

		const button = renderer.root.findAllByType("button").find(
			(node: ReactTestInstance) => node.props["aria-label"] === "Add recipe to meal plan",
		);
		if (!button) throw new Error("Expected the add-to-plan button");
		expect(button.children).toContain("Add to meal plan");
		const onClick = button.props.onClick;
		if (typeof onClick !== "function") throw new Error("Expected the add-to-plan click handler");
		act(() => onClick());
		expect(onAddToPlan).toHaveBeenCalledOnce();
	});

	it("communicates the pending state", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={false}
						onClickFavorite={vi.fn()}
						onAddToPlan={vi.fn()}
						isAddingToPlan
					/>
				</MemoryRouter>,
			);
		});
		if (!renderer) throw new Error("Expected the recipe summary renderer");

		const button = renderer.root.findAllByType("button").find(
			(node: ReactTestInstance) => node.props["aria-label"] === "Adding recipe to meal plan",
		);
		if (!button) throw new Error("Expected the pending add-to-plan button");
		expect(button.props.disabled).toBe(true);
		expect(button.props["aria-busy"]).toBe(true);
		expect(button.children).toContain("Adding…");
	});

	it("exposes Save to collection without replacing the default save action", () => {
		const onSaveToCollection = vi.fn();
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={false}
						onClickFavorite={vi.fn()}
						onSaveToCollection={onSaveToCollection}
					/>
				</MemoryRouter>,
			);
		});
		if (!renderer) throw new Error("Expected the recipe summary renderer");

		const button = renderer.root.findAllByType("button").find(
			(node: ReactTestInstance) => node.props["aria-label"] === "Save recipe to collection",
		);
		if (!button) throw new Error("Expected the save-to-collection button");
		expect(button.children).toContain("Save to collection");
		const onClick = button.props.onClick;
		if (typeof onClick !== "function") throw new Error("Expected the save-to-collection click handler");
		act(() => onClick());
		expect(onSaveToCollection).toHaveBeenCalledOnce();
	});
});
