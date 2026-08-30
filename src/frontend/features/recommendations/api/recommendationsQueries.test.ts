// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { HomeFeedResponse } from "@/shared/api/contracts";
import { dismissRecommendation } from "./recommendationsApi";
import { useDismissRecommendationMutation } from "./recommendationsQueries";

const showToast = vi.fn();
vi.mock("./recommendationsApi", () => ({ dismissRecommendation: vi.fn() }));
vi.mock("@/app/ToastProvider", () => ({ useToast: () => ({ showToast }) }));

describe("recommendationsQueries", () => {
	const feed: HomeFeedResponse = {
		personalized: true,
		sections: [{ key: "recommended", title: "For you", description: "Ideas", recipes: [
			{ recipe_id: 42, recipe_name: "Pasta", recipe_description: null, date_added: null, image_url: null, prep_time_minutes: 1, cook_time_minutes: 1, total_time_minutes: 2, user_id: 1 },
		]}],
	};

	it("invalidates home feed and shows a success toast", async () => {
		vi.mocked(dismissRecommendation).mockResolvedValueOnce({ message: "ok" });
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);

		const { result } = renderHook(() => useDismissRecommendationMutation(), { wrapper });
		result.current.mutate(42);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(dismissRecommendation).toHaveBeenCalledWith(42);
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["home-feed"] });
		expect(showToast).toHaveBeenCalledWith({ title: "Recommendation hidden" });
	});

	it("hides a recipe optimistically and restores it when the request fails", async () => {
		let rejectRequest: (error: Error) => void = () => undefined;
		vi.mocked(dismissRecommendation).mockReturnValueOnce(new Promise((_, reject) => { rejectRequest = reject; }));
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		queryClient.setQueryData(["home-feed", "personalized"], feed);
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);
		const { result } = renderHook(() => useDismissRecommendationMutation(), { wrapper });

		result.current.mutate(42);
		await waitFor(() => expect(queryClient.getQueryData<HomeFeedResponse>(["home-feed", "personalized"])?.sections[0].recipes).toEqual([]));
		rejectRequest(new Error("failed"));
		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(queryClient.getQueryData<HomeFeedResponse>(["home-feed", "personalized"])).toEqual(feed);
	});
});
