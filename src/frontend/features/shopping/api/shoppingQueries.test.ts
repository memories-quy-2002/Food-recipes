// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { householdScope, PERSONAL_KITCHEN } from "@/features/households/householdScope";
import {
	addShoppingItem,
	listShoppingItems,
} from "./shoppingApi";
import {
	shoppingQueryKeys,
	useAddShoppingItemMutation,
	useShoppingListQuery,
} from "./shoppingQueries";

vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("./shoppingApi", async () => {
	const actual = await vi.importActual<typeof import("./shoppingApi")>("./shoppingApi");
	return {
		...actual,
		addShoppingItem: vi.fn(),
		listShoppingItems: vi.fn(),
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

describe("shoppingQueries", () => {
	beforeEach(() => {
		vi.mocked(addShoppingItem).mockReset();
		vi.mocked(listShoppingItems).mockReset();
	});

	it("includes the authenticated user and kitchen scope in shopping query keys", () => {
		expect(shoppingQueryKeys.forUser(7, PERSONAL_KITCHEN)).toEqual([
			"shopping-list",
			7,
			"personal",
		]);
		expect(shoppingQueryKeys.forUser(7, householdScope(12))).toEqual([
			"shopping-list",
			7,
			"household:12",
		]);
	});

	it("passes the selected scope to the shopping query function", async () => {
		const scope = householdScope(12);
		vi.mocked(listShoppingItems).mockResolvedValueOnce({ items: [] });
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});

		renderHook(() => useShoppingListQuery(scope), { wrapper: createWrapper(queryClient) });

		await waitFor(() => expect(listShoppingItems).toHaveBeenCalled());
		expect(listShoppingItems).toHaveBeenCalledWith(scope, expect.any(AbortSignal));
		expect(queryClient.getQueryData(shoppingQueryKeys.forUser(7, scope))).toEqual({ items: [] });
	});

	it("passes the selected scope to mutations and invalidates only that shopping cache", async () => {
		const scope = householdScope(12);
		vi.mocked(addShoppingItem).mockResolvedValueOnce({
			item: {
				item_id: 4,
				label: "Rice",
				quantity: null,
				source_recipe_id: null,
				source_recipe_name: null,
				checked: false,
			},
		});
		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		});
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useAddShoppingItemMutation(scope), {
			wrapper: createWrapper(queryClient),
		});

		result.current.mutate({ label: "Rice" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(addShoppingItem).toHaveBeenCalledWith({ label: "Rice" }, scope);
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: shoppingQueryKeys.forUser(7, scope),
		});
	});
});
