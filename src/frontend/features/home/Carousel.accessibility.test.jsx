import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Carousel from "./Carousel";

const items = [
	{
		id: 1,
		name: "Breakfast favorites",
		description: "Start the day with something good.",
		imageName: "breakfast",
	},
	{
		id: 2,
		name: "Dinner favorites",
		description: "Comforting dinner ideas.",
		imageName: "dinner",
	},
];

const renderCarousel = () => {
	let renderer;
	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter>
				<Carousel items={items} />
			</MemoryRouter>
		);
	});
	return renderer;
};

describe("Carousel accessibility", () => {
	it("keeps only the active slide in the accessibility and focus tree", () => {
		const renderer = renderCarousel();
		const slides = renderer.root.findAll(
			(node) => node.props.className === "home__carousel__item"
		);

		expect(slides).toHaveLength(2);
		expect(slides[0].props["aria-hidden"]).toBe(false);
		expect(slides[0].props.inert).toBeUndefined();
		expect(slides[1].props["aria-hidden"]).toBe(true);
		expect(slides[1].props.inert).toBe("");
	});

	it("uses section-level headings for slide titles", () => {
		const renderer = renderCarousel();

		expect(renderer.root.findAllByType("h1")).toHaveLength(0);
		expect(renderer.root.findAllByType("h2")).toHaveLength(items.length);
	});

	it("labels the carousel as a discoverable region", () => {
		const renderer = renderCarousel();
		const region = renderer.root.find(
			(node) => node.props.className === "home__carousel"
		);

		expect(region.props.role).toBe("region");
		expect(region.props["aria-roledescription"]).toBe("carousel");
		expect(region.props["aria-label"]).toBe("Featured meals");
	});
});
