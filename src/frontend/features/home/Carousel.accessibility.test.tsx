import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
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
	let renderer!: ReactTestRenderer;
	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter>
				<Carousel items={items} />
			</MemoryRouter>
		);
	});
	return renderer;
};

const getRegion = (renderer: ReactTestRenderer): ReactTestInstance =>
	renderer.root.findAll((node: ReactTestInstance) => node.props.role === "region" && node.props["aria-roledescription"] === "carousel")[0];

const getSlides = (renderer: ReactTestRenderer): ReactTestInstance[] =>
	renderer.root.findAll(
		(node: ReactTestInstance) => node.props.role === "group" && node.props["aria-roledescription"] === "slide"
	);

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
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

	it("uses the shared wide content width used by Home sections", () => {
		const renderer = renderCarousel();
		const region = getRegion(renderer);

		expect(region.props.className).toContain("max-w-[112rem]");
	});

	it("pauses automatic rotation while keyboard focus is inside", () => {
		vi.useFakeTimers();
		const renderer = renderCarousel();
		const region = getRegion(renderer);
		const focusCapture = region.props.onFocusCapture;
		const blurCapture = region.props.onBlurCapture;
		if (typeof focusCapture !== "function" || typeof blurCapture !== "function") throw new Error("Carousel focus handlers were not rendered");

		act(() => focusCapture());
		act(() => vi.advanceTimersByTime(10000));
		expect(getSlides(renderer)[0].props["aria-hidden"]).toBe(false);

		act(() =>
			blurCapture({
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
		act(() => vi.advanceTimersByTime(10000));

		expect(getSlides(renderer)[0].props["aria-hidden"]).toBe(false);
	});
});
