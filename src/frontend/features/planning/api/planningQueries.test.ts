// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { householdScope, PERSONAL_KITCHEN } from "@/features/households/householdScope";
import { createMealPlan, getMealPlan, listMealPlans } from "./planningApi";
import {
	planningQueryKeys,
	useCreateMealPlanMutation,
	useMealPlanForWeekQuery,
} from "./planningQueries";

vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("./planningApi", async () => {
	const actual = await vi.importActual<typeof import("./planningApi")>("./planningApi");
	return {
		...actual,
		createMealPlan: vi.fn(),
		getMealPlan: vi.fn(),
		listMealPlans: vi.fn(),
	};
});

const auth = {
	current: {
		isAuthenticated: true,
		hydrated: true,
		user: { user_id: 7 },
		userId: 7,
		token: "token",
	},
};

const createWrapper = (queryClient: QueryClient) =>
	({ children }: { children: ReactNode }) =>
		createElement(
			QueryClientProvider,
			{ client: queryClient },
			createElement(AuthContext.Provider, { value: { auth } }, children),
		);

describe("planningQueries", () => {
	beforeEach(() => {
		vi.mocked(listMealPlans).mockReset();
		vi.mocked(getMealPlan).mockReset();
		vi.mocked(createMealPlan).mockReset();
	});

	it("includes the authenticated user and kitchen scope in meal-plan query keys", () => {
		expect(
			planningQueryKeys.week(7, PERSONAL_KITCHEN, "2026-08-24", "2026-08-30"),
		).toEqual(["planning", 7, "personal", "week", "2026-08-24", "2026-08-30", null]);
		expect(
			planningQueryKeys.week(7, householdScope(12), "2026-08-24", "2026-08-30"),
		).toEqual(["planning", 7, "household:12", "week", "2026-08-24", "2026-08-30", null]);
	});

	it("passes the selected scope to meal-plan reads", async () => {
		const scope = householdScope(12);
		vi.mocked(listMealPlans).mockResolvedValueOnce({
			plans: [
				{
					plan_id: 12,
					name: "Shared week",
					start_date: "2026-08-24",
					end_date: "2026-08-30",
					created_at: "",
					updated_at: "",
				},
			],
		});
		vi.mocked(getMealPlan).mockResolvedValueOnce({
			plan: {
				plan_id: 12,
				name: "Shared week",
				start_date: "2026-08-24",
				end_date: "2026-08-30",
				created_at: "",
				updated_at: "",
			},
			items: [],
		});
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		renderHook(
			() =>
				useMealPlanForWeekQuery(
					{ from: "2026-08-24", to: "2026-08-30" },
					{},
					scope,
				),
			{ wrapper: createWrapper(queryClient) },
		);

		await waitFor(() => expect(getMealPlan).toHaveBeenCalled());
		expect(listMealPlans).toHaveBeenCalledWith(
			{ from: "2026-08-24", to: "2026-08-30" },
			expect.any(AbortSignal),
			scope,
		);
		expect(getMealPlan).toHaveBeenCalledWith(12, expect.any(AbortSignal), scope);
		expect(queryClient.getQueryData(
			planningQueryKeys.week(7, scope, "2026-08-24", "2026-08-30"),
		)).toEqual({
			plan: expect.objectContaining({ plan_id: 12 }),
			items: [],
		});
	});

	it("does not retain personal data while a new scope is loading", async () => {
		let resolveHousehold: ((value: { plans: [] }) => void) | undefined;
		vi.mocked(listMealPlans).mockImplementation((_range, _signal, scope) =>
			scope?.kind === "household"
				? new Promise((resolve) => {
						resolveHousehold = resolve;
				  })
				: Promise.resolve({
						plans: [
							{
								plan_id: 12,
								name: "Personal week",
								start_date: "2026-08-24",
								end_date: "2026-08-30",
								created_at: "",
								updated_at: "",
							},
						],
					}),
		);
		vi.mocked(getMealPlan).mockResolvedValue({
			plan: {
				plan_id: 12,
				name: "Personal week",
				start_date: "2026-08-24",
				end_date: "2026-08-30",
				created_at: "",
				updated_at: "",
			},
			items: [],
		});
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const { result, rerender } = renderHook(
			({ scope }: { scope: typeof PERSONAL_KITCHEN | ReturnType<typeof householdScope> }) =>
				useMealPlanForWeekQuery(
					{ from: "2026-08-24", to: "2026-08-30" },
					{},
					scope,
				),
			{
				initialProps: { scope: PERSONAL_KITCHEN },
				wrapper: createWrapper(queryClient),
			},
		);

		await waitFor(() => expect(result.current.data?.plan.name).toBe("Personal week"));
		rerender({ scope: householdScope(12) });

		expect(result.current.data).toBeUndefined();
		resolveHousehold?.({ plans: [] });
	});

	it("passes the selected scope to mutations and invalidates only that scope", async () => {
		const scope = householdScope(12);
		vi.mocked(createMealPlan).mockResolvedValueOnce({
			plan: {
				plan_id: 12,
				name: "Shared week",
				start_date: "2026-08-24",
				end_date: "2026-08-30",
				created_at: "",
				updated_at: "",
			},
			items: [],
		});
		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		});
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useCreateMealPlanMutation(scope), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate({ name: "Shared week", from: "2026-08-24", to: "2026-08-30" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(createMealPlan).toHaveBeenCalledWith(
			{ name: "Shared week", from: "2026-08-24", to: "2026-08-30" },
			scope,
		);
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: planningQueryKeys.forUser(7, scope),
		});
	});
});
