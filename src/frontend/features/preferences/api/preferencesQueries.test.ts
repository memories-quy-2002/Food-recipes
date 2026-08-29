// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import {
	useFoodPreferencesQuery,
	useUpdateFoodPreferencesMutation,
	preferencesQueryKeys,
} from "./preferencesQueries";
import type { FoodPreferences } from "./preferencesApi";
import { getFoodPreferences, replaceFoodPreferences } from "./preferencesApi";

vi.mock("./preferencesApi", async () => {
	const actual = await vi.importActual<typeof import("./preferencesApi")>(
		"./preferencesApi",
	);
	return {
		...actual,
		getFoodPreferences: vi.fn(),
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
	beforeEach(() => {
		vi.mocked(getFoodPreferences).mockReset();
		vi.mocked(replaceFoodPreferences).mockReset();
	});

	it("keeps preference query data isolated when the authenticated user changes", async () => {
		const firstUserPreferences = { ...preferences, diet: "vegan" };
		const secondUserPreferences = { ...preferences, diet: "vegetarian" };
		vi.mocked(getFoodPreferences)
			.mockResolvedValueOnce(firstUserPreferences)
			.mockResolvedValueOnce(secondUserPreferences);
		const auth = {
			current: {
				isAuthenticated: true,
				hydrated: true,
				user: { user_id: 7 },
				userId: 7,
				token: "token",
			},
		};
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(
				QueryClientProvider,
				{ client: queryClient },
				createElement(AuthContext.Provider, { value: { auth } }, children),
			);
		const { result, rerender } = renderHook(() => useFoodPreferencesQuery(), {
			wrapper,
		});

		await waitFor(() => expect(result.current.data).toEqual(firstUserPreferences));
		auth.current = {
			...auth.current,
			user: { user_id: 8 },
			userId: 8,
		};
		rerender();
		await waitFor(() => expect(result.current.data).toEqual(secondUserPreferences));

		expect(queryClient.getQueryData(preferencesQueryKeys.forUser(7))).toEqual(
			firstUserPreferences,
		);
		expect(queryClient.getQueryData(preferencesQueryKeys.forUser(8))).toEqual(
			secondUserPreferences,
		);
	});

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
