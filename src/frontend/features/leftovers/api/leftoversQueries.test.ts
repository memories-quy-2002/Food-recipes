// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/AuthProvider";
import { PERSONAL_KITCHEN } from "@/shared/api/personalKitchenScope";
import { createLeftover, listLeftovers } from "./leftoversApi";
import { leftoversQueryKeys, useCreateLeftoverMutation, useLeftoversQuery } from "./leftoversQueries";

vi.mock("@/app/ToastProvider", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("./leftoversApi", () => ({
	createLeftover: vi.fn(),
	listLeftovers: vi.fn(),
}));

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

describe("leftoversQueries", () => {
	beforeEach(() => {
		vi.mocked(listLeftovers).mockReset();
		vi.mocked(createLeftover).mockReset();
	});


	it("passes scope to reads and invalidates leftovers plus planning after create", async () => {
		const scope = PERSONAL_KITCHEN;
		vi.mocked(listLeftovers).mockResolvedValue({ items: [] });
		vi.mocked(createLeftover).mockResolvedValue({ leftover: { leftover_id: 8 } as never });
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

		const read = renderHook(() => useLeftoversQuery(scope), { wrapper: createWrapper(queryClient) });
		await waitFor(() => expect(read.result.current.isSuccess).toBe(true));
		expect(listLeftovers).toHaveBeenCalledWith(scope, expect.any(AbortSignal));

		const mutation = renderHook(() => useCreateLeftoverMutation(scope), { wrapper: createWrapper(queryClient) });
		mutation.result.current.mutate({ cookingHistoryId: 4, servings: 2, expiresAt: "2026-09-02T23:59:59.000Z" });
		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: leftoversQueryKeys.forUser(7, scope) });
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["planning", 7, "personal"] });
	});
});
