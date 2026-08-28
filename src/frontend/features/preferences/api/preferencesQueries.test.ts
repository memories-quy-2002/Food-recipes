// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	useUpdateFoodPreferencesMutation,
	preferencesQueryKeys,
} from "./preferencesQueries";
import type { FoodPreferences } from "./preferencesApi";
import { replaceFoodPreferences } from "./preferencesApi";

vi.mock("./preferencesApi", async () => {
	const actual = await vi.importActual<typeof import("./preferencesApi")>(
		"./preferencesApi",
	);
	return {
		...actual,
		replaceFoodPreferences: vi.fn(),
	};
});

const preferences: FoodPreferences = {
	diet: "vegan",
	avoidedAllergens: [],
	dislikedIngredients: [],
	preferredCuisines: [],
	cookingSkill: null,
	maxWeekdayCookMinutes: null,
	defaultServings: 2,
	maxCaloriesPerServing: null,
	minProteinGrams: null,
	strictDislikes: false,
};

describe("preferencesQueries", () => {
	it("invalidates the food preferences query after a successful save", async () => {
		vi.mocked(replaceFoodPreferences).mockResolvedValueOnce(preferences);
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);
		const { result } = renderHook(
			() => useUpdateFoodPreferencesMutation(),
			{ wrapper },
		);

		result.current.mutate(preferences);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: preferencesQueryKeys.all,
		});
	});
});
