// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Reviews from "./Reviews";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/shared/api/axios", () => ({ default: { get: mocks.get } }));

describe("Reviews content", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mocks.get.mockResolvedValue({
			data: {
				ratings: [{
					rating_id: 1,
					recipe_id: 4,
					recipe_name: "Soup",
					image_url: null,
					score: 4,
					review: "",
				}],
			},
		});
	});

	afterEach(() => cleanup());

	it("shows review fallback text and a labeled recipe action", async () => {
		render(<MemoryRouter><Reviews /></MemoryRouter>);

		expect(await screen.findByText("No written review yet.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "View recipe Soup" })).toBeInTheDocument();
		expect(screen.getByText("View recipe")).toBeInTheDocument();
	});
});
