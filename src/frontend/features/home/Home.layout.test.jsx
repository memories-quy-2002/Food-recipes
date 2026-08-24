import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./Home";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn().mockResolvedValue({
			data: { meals: [{ id: 1, meal_name: "Dinner" }] },
		}),
	},
}));

vi.mock("@/features/home/Carousel", () => ({
	default: () => <section data-testid="home-carousel">Carousel</section>,
}));

vi.mock("@/features/home/HomeMain", () => ({
	default: () => <section data-testid="home-main">Home main</section>,
}));

vi.mock("@/features/suggestions/SuggestionPanel", () => ({
	default: () => <section data-testid="suggestions">Suggestions</section>,
}));

vi.mock("@/shared/seo/PageHelmet", () => ({ default: () => null }));

vi.mock("@/app/AuthProvider", () => ({
	AuthContext: React.createContext({
		auth: { current: { isAuthenticated: false } },
	}),
}));

describe("Home layout hierarchy", () => {
	it("keeps the featured carousel above discovery and suggestions", async () => {
		render(<Home />);

		await waitFor(() => expect(screen.getByTestId("home-carousel")).toBeInTheDocument());

		const carousel = screen.getByTestId("home-carousel");
		const homeMain = screen.getByTestId("home-main");
		const suggestions = screen.getByTestId("suggestions");

		expect(carousel.compareDocumentPosition(homeMain) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(homeMain.compareDocumentPosition(suggestions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});
