import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
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

const getRegion = (renderer) =>
	renderer.root.find((node) => node.props.className === "home__carousel");

const getSlides = (renderer) =>
	renderer.root.findAll(
		(node) => node.props.className === "home__carousel__item"
	);

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("Carousel accessibility", () => {
	it("keeps only the active slide in the accessibility and focus tree", () => {
		const renderer = renderCarousel();
		const slides = getSlides(renderer);

		expect(slides).toHaveLength(2);
		expect(slides[0].props["aria-hidden"]).toBe(false);
		expect(slides[0].props.inert).toBeUndefined();
		expect(slides[1].props["aria-hidden"]).toBe(true);
		expect(slides[1].props.inert).toBe(true);
	});

	it("uses section-level headings for slide titles", () => {
		const renderer = renderCarousel();

		expect(renderer.root.findAllByType("h1")).toHaveLength(0);
		expect(renderer.root.findAllByType("h2")).toHaveLength(items.length);
	});

	it("labels the carousel as a discoverable region", () => {
		const renderer = renderCarousel();
		const region = getRegion(renderer);

		expect(region.props.role).toBe("region");
		expect(region.props["aria-roledescription"]).toBe("carousel");
		expect(region.props["aria-label"]).toBe("Featured meals");
	});

	it("pauses automatic rotation while keyboard focus is inside", () => {
		vi.useFakeTimers();
		const renderer = renderCarousel();
		const region = getRegion(renderer);

		act(() => region.props.onFocusCapture());
		act(() => vi.advanceTimersByTime(10000));
		expect(getSlides(renderer)[0].props["aria-hidden"]).toBe(false);

		act(() =>
			region.props.onBlurCapture({
				currentTarget: { contains: () => false },
				relatedTarget: null,
			})
		);
		act(() => vi.advanceTimersByTime(10000));
		expect(getSlides(renderer)[1].props["aria-hidden"]).toBe(false);
	});

	it("does not auto-rotate when reduced motion is requested", () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", {
			matchMedia: vi.fn(() => ({
				matches: true,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		});

		const renderer = renderCarousel();
		act(() => vi.advanceTimersByTime(20000));

		expect(getSlides(renderer)[0].props["aria-hidden"]).toBe(false);
	});
});
