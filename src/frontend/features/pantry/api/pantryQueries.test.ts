// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { householdScope, PERSONAL_KITCHEN } from "@/features/households/householdScope";
import { createPantryItem, listPantry } from "./pantryApi";
import {
	pantryQueryKeys,
	useCreatePantryItemMutation,
	usePantryQuery,
} from "./pantryQueries";

vi.mock("./pantryApi", async () => {
	const actual = await vi.importActual<typeof import("./pantryApi")>("./pantryApi");
	return {
		...actual,
		listPantry: vi.fn(),
		createPantryItem: vi.fn(),
	};
});

describe("pantryQueries", () => {
	beforeEach(() => vi.mocked(listPantry).mockReset());

	it("includes the authenticated user and kitchen scope in its query key", () => {
		expect(pantryQueryKeys.forUser(7, PERSONAL_KITCHEN)).toEqual([
			"pantry",
			7,
			"personal",
		]);
		expect(pantryQueryKeys.forUser(7, householdScope(12))).toEqual([
			"pantry",
			7,
			"household:12",
		]);
	});

	it("passes the selected scope to the pantry query function", async () => {
		const scope = householdScope(12);
		vi.mocked(listPantry).mockResolvedValueOnce({ items: [] });
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

		renderHook(() => usePantryQuery(scope), { wrapper });

		await waitFor(() => expect(listPantry).toHaveBeenCalled());
		expect(listPantry).toHaveBeenCalledWith(scope, expect.any(AbortSignal));
		expect(queryClient.getQueryData(pantryQueryKeys.forUser(7, scope))).toEqual({ items: [] });
	});

	it("passes the selected scope to pantry mutations and invalidates its cache", async () => {
		const scope = householdScope(12);
		vi.mocked(createPantryItem).mockResolvedValueOnce({ item: { pantry_id: 4, name: "Rice", have: true, quantity: null, unit: null } });
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
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		});
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(
				QueryClientProvider,
				{ client: queryClient },
				createElement(AuthContext.Provider, { value: { auth } }, children),
			);
		const { result } = renderHook(() => useCreatePantryItemMutation(scope), { wrapper });

		result.current.mutate({ name: "Rice" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(createPantryItem).toHaveBeenCalledWith({ name: "Rice" }, scope);
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: pantryQueryKeys.forUser(7, scope),
		});
	});
});
