// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startCookingSession } from "@/features/history/api/cookingSessionApi";
import { useCookingSession } from "./useCookingSession";

vi.mock("@/features/history/api/cookingSessionApi", async () => {
	const actual = await vi.importActual<typeof import("@/features/history/api/cookingSessionApi")>("@/features/history/api/cookingSessionApi");
	return { ...actual, startCookingSession: vi.fn() };
});

const wrapper = ({ children }: { children: ReactNode }) =>
	createElement(QueryClientProvider, { client: new QueryClient() }, children);

describe("useCookingSession leftover source", () => {
	beforeEach(() => {
		vi.mocked(startCookingSession).mockResolvedValue({
			session: {
				session_id: 3,
				user_id: 7,
				recipe_id: 42,
				recipe_name: "Soup",
				meal_plan_item_id: 9,
				planned_date: "2026-08-31",
				slot: "lunch",
				servings: 2,
				current_step: 0,
				status: "active",
				started_at: "",
				last_active_at: "",
				paused_at: null,
				completed_at: null,
				created_at: "",
				updated_at: "",
			},
		});
		window.localStorage.clear();
	});

	it("starts with leftover provenance and does not reuse the recipe storage key", async () => {
		renderHook(() => useCookingSession({
			enabled: true,
			userId: 7,
			recipeId: 42,
			mealPlanItemId: 9,
			servings: 2,
			sourceType: "leftover",
			leftoverBatchId: 8,
			householdId: 22,
		}), { wrapper });

		await waitFor(() => expect(startCookingSession).toHaveBeenCalled());
		expect(startCookingSession).toHaveBeenCalledWith({
			recipeId: 42,
			mealPlanItemId: 9,
			servings: 2,
			sourceType: "leftover",
			leftoverBatchId: 8,
			householdId: 22,
		});
		expect(window.localStorage.getItem("food-recipes:cooking-session:7:42:leftover:8")).toBeTruthy();
	});
});
