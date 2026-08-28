// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FoodPreferencesPage from "./FoodPreferencesPage";
import type { FoodPreferences } from "./api/preferencesApi";

const preferences: FoodPreferences = {
	diet: "vegan",
	avoidedAllergens: ["peanuts"],
	dislikedIngredients: ["cilantro"],
	preferredCuisines: ["Vietnamese"],
	cookingSkill: "intermediate",
	maxWeekdayCookMinutes: 30,
	defaultServings: 2,
	maxCaloriesPerServing: 650,
	minProteinGrams: 30,
	strictDislikes: false,
};

const mockPreferencesQuery = vi.hoisted(() => ({
	data: null as FoodPreferences | null,
	isPending: false,
	isError: false,
	refetch: vi.fn(),
}));

const mockSaveMutation = vi.hoisted(() => ({
	mutate: vi.fn(),
	isPending: false,
}));

vi.mock("./api/preferencesQueries", () => ({
	useFoodPreferencesQuery: () => mockPreferencesQuery,
	useUpdateFoodPreferencesMutation: () => mockSaveMutation,
}));

const renderPage = (): void => {
	render(<FoodPreferencesPage />);
};

describe("FoodPreferencesPage", () => {
	beforeEach(() => {
		mockPreferencesQuery.data = preferences;
		mockPreferencesQuery.isPending = false;
		mockPreferencesQuery.isError = false;
		mockSaveMutation.isPending = false;
		mockSaveMutation.mutate.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("populates its fields from the API preferences", () => {
		renderPage();

		expect(screen.getByLabelText("Diet")).toHaveValue("vegan");
		expect(screen.getByLabelText("Cooking skill")).toHaveValue("intermediate");
		expect(screen.getByLabelText("Weekday maximum cooking time")).toHaveValue(30);
		expect(screen.getByText("peanuts")).toBeInTheDocument();
		expect(screen.getByText("Vietnamese")).toBeInTheDocument();
	});

	it("adds a cuisine chip with Enter and exposes a keyboard-operable remove button", async () => {
		const user = userEvent.setup();
		mockPreferencesQuery.data = { ...preferences, preferredCuisines: [] };
		renderPage();

		const input = screen.getByRole("textbox", { name: "Preferred cuisines" });
		await user.type(input, "Italian");
		await user.keyboard("{Enter}");

		expect(screen.getByText("Italian")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Remove Italian" }),
		).toBeInTheDocument();
	});

	it("blocks saving invalid numeric values and describes the field error", async () => {
		const user = userEvent.setup();
		renderPage();

		const servings = screen.getByLabelText("Default servings");
		await user.clear(servings);
		await user.type(servings, "25");
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(mockSaveMutation.mutate).not.toHaveBeenCalled();
		expect(screen.getByText("Use between 1 and 24 servings.")).toBeInTheDocument();
		expect(servings).toHaveAttribute("aria-invalid", "true");
		expect(servings).toHaveAttribute(
			"aria-describedby",
			expect.stringContaining("default-servings-error"),
		);
	});

	it("keeps the edited draft visible when saving fails", async () => {
		const user = userEvent.setup();
		mockSaveMutation.mutate.mockImplementation(
			(_input: FoodPreferences, options?: { onError?: (error: unknown) => void }) =>
				options?.onError?.(new Error("Save failed")),
		);
		renderPage();

		const diet = screen.getByLabelText("Diet");
		await user.selectOptions(diet, "vegetarian");
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(diet).toHaveValue("vegetarian");
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Your preferences could not be saved.",
		);
	});

	it("keeps the page constrained for narrow mobile viewports", () => {
		renderPage();

		expect(screen.getByRole("main")).toHaveClass("min-w-0", "overflow-x-hidden");
		expect(screen.getByRole("form", { name: "Food preferences" })).toHaveClass("min-w-0");
	});
});
