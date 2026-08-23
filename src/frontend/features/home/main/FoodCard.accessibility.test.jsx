import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter } from "react-router-dom";
import FoodCard from "./FoodCard";

const renderCard = (favorite = false) => {
	const onClickFavorite = vi.fn();
	let renderer;

	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter>
				<FoodCard
					id={7}
					name="Pasta Primavera"
					category="Dinner"
					meal="Main course"
					ratings={12}
					score={4.5}
					favorite={favorite}
					onClickFavorite={onClickFavorite}
				/>
			</MemoryRouter>
		);
	});

	return { renderer, onClickFavorite };
};

describe("FoodCard semantics", () => {
	it("uses a recipe Link and keeps the favorite control outside it", () => {
		const { renderer } = renderCard();
		const link = renderer.root.findByType(Link);
		const button = renderer.root.findByType("button");

		expect(link.props.to).toBe("/recipe?id=7");
		expect(link.props["aria-label"]).toBe("Open Pasta Primavera");
		expect(button.props["aria-label"]).toBe("Add to favorite");
		expect(button.props.type).toBe("button");
		expect(button.parent.parent.type).toBe("article");
	});

	it("isolates favorite activation from recipe navigation", () => {
		const { renderer, onClickFavorite } = renderCard();
		const button = renderer.root.findByType("button");
		const stopPropagation = vi.fn();

		act(() => button.props.onClick({ stopPropagation }));

		expect(stopPropagation).toHaveBeenCalledOnce();
		expect(onClickFavorite).toHaveBeenCalledWith(7);
	});
});
