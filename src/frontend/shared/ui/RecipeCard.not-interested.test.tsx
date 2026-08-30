// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import RecipeCard from "./RecipeCard";

const recipe = {
	recipe_id: 42, recipe_name: "Pasta", recipe_description: null, date_added: null,
	image_url: null, prep_time_minutes: 1, cook_time_minutes: 1, total_time_minutes: 2, user_id: 1,
};

describe("RecipeCard not-interested action", () => {
	it("renders an accessible callback action and does not navigate when clicked", () => {
		const onNotInterested = vi.fn();
		render(<MemoryRouter initialEntries={["/home"]}><RecipeCard recipe={recipe} onNotInterested={onNotInterested} /><LocationProbe /></MemoryRouter>);

		const action = screen.getByRole("button", { name: "Not interested in Pasta" });
		expect(action).toHaveAttribute("title", "Not interested");
		fireEvent.click(action);
		expect(onNotInterested).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("location")).toHaveTextContent("/home");
	});

	it("exposes a disabled pending state and ignores activation", () => {
		const onNotInterested = vi.fn();
		render(<MemoryRouter><RecipeCard recipe={recipe} onNotInterested={onNotInterested} notInterestedPending /></MemoryRouter>);

		const action = screen.getByRole("button", { name: "Hiding Pasta" });
		expect(action).toBeDisabled();
		expect(action).toHaveAttribute("aria-busy", "true");
		fireEvent.click(action);
		expect(onNotInterested).not.toHaveBeenCalled();
	});
});

const LocationProbe = () => <span data-testid="location">{useLocation().pathname}</span>;
