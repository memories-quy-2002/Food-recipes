// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosResponse } from "axios";
import Wishlist from "./Wishlist";
import axios from "@/shared/api/axios";
import type { RootState } from "@/app/store";
import type { RecipeSummary } from "@/shared/api/contracts";

vi.mock("@/shared/api/axios", () => ({
	default: { get: vi.fn(), delete: vi.fn() },
}));

vi.mock("react-redux", () => ({
	useSelector: (selector: (state: RootState) => RootState["auth"]) =>
		selector({
			auth: {
				hydrated: true,
				local: { isAuthenticated: true, user: { user_id: 7 } },
				session: { isAuthenticated: false, user: null },
			},
		}),
}));

vi.mock("@/features/saved/api/collectionsQueries", () => ({
	useCollectionsQuery: () => ({ data: { collections: [] }, isLoading: false, isError: false }),
	useCollectionRecipesQuery: () => ({ data: { recipes: [] }, isLoading: false, isError: false }),
	useCreateCollectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
	useRenameCollectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
	useDeleteCollectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
	useRemoveRecipeFromCollectionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const recipes: RecipeSummary[] = [
	{ recipe_id: 1, recipe_name: "First recipe", recipe_description: null, date_added: null, image_url: null, prep_time_minutes: 10, cook_time_minutes: 10, total_time_minutes: 20, user_id: 1, meal_id: 1, meal_name: "Dinner", meal_description: null, category_id: 1, category_name: "Main", overall_score: 4, num_ratings: 1 },
	{ recipe_id: 2, recipe_name: "Second recipe", recipe_description: null, date_added: null, image_url: null, prep_time_minutes: 10, cook_time_minutes: 10, total_time_minutes: 20, user_id: 1, meal_id: 1, meal_name: "Dinner", meal_description: null, category_id: 1, category_name: "Main", overall_score: 5, num_ratings: 2 },
];

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid="route-search">{location.search}</output>;
};

const renderWishlist = (initialEntry = "/saved") =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Wishlist />
			<LocationProbe />
		</MemoryRouter>,
		{ container: Object.assign(document.body.appendChild(document.createElement("div")), { id: "root" }) }
	);

describe("Wishlist remove confirmation accessibility", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.mocked(axios.get).mockResolvedValue({ data: { wishlist: recipes } });
	});
	afterEach(() => cleanup());

	it("moves focus into the dialog, traps the background, and restores focus on Escape", async () => {
		const user = userEvent.setup();
		renderWishlist();
		await screen.findByRole("button", { name: "Remove First recipe" });
		const trigger = screen.getByRole("button", { name: "Remove First recipe" });

		await user.click(trigger);

		const dialog = await screen.findByRole("dialog", {
			name: "Remove saved recipe?",
		});
		await waitFor(() => expect(screen.getByRole("button", { name: "Remove" })).toHaveFocus());
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(document.getElementById("root")).toHaveAttribute("inert");

		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("uses the captured item and ignores a second submit while removing", async () => {
		const user = userEvent.setup();
		let resolveDelete: ((value: { status: number }) => void) | undefined;
		vi.mocked(axios.delete).mockImplementation(
			() => new Promise((resolve) => {
				resolveDelete = () => resolve({ status: 200, statusText: "OK", headers: {}, config: { headers: {} }, data: {} });
			})
		);
		renderWishlist();
		await screen.findByRole("button", { name: "Remove First recipe" });

		await user.click(screen.getAllByRole("button", { name: "Remove First recipe" })[0]);
		await user.click(screen.getByRole("button", { name: "Remove" }));
		fireEvent.click(screen.getByRole("button", { name: "Removing…" }));

		expect(axios.delete).toHaveBeenCalledTimes(1);
		expect(axios.delete).toHaveBeenCalledWith("/users/me/wishlist/1");
		resolveDelete?.({ status: 200 });
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("keeps the dialog open and recovers after a remove error", async () => {
		const user = userEvent.setup();
		vi.mocked(axios.delete).mockRejectedValueOnce({ response: { data: { message: "Remove failed" } } });
		renderWishlist();
		await screen.findByRole("button", { name: "Remove First recipe" });

		await user.click(screen.getAllByRole("button", { name: "Remove First recipe" })[0]);
		await user.click(screen.getByRole("button", { name: "Remove" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Remove failed");
		expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("loads the requested Saved page and preserves search and sort in the URL", async () => {
		const user = userEvent.setup();
		vi.mocked(axios.get)
			.mockResolvedValueOnce({
				data: {
					wishlist: recipes.map((recipe) => ({ recipe, savedAt: "2026-08-23T06:30:00.000Z" })),
					pagination: { page: 2, limit: 12, total: 37, totalPages: 4, hasNext: true },
				},
			})
			.mockResolvedValue({
				data: {
					wishlist: recipes.map((recipe) => ({ recipe, savedAt: "2026-08-23T06:30:00.000Z" })),
					pagination: { page: 3, limit: 12, total: 37, totalPages: 4, hasNext: true },
				},
			});
		renderWishlist("/saved?page=2&search=pasta&sort=rating");

		await screen.findByRole("button", { name: "Next page" });
		expect(screen.getByLabelText("Search")).toHaveValue("pasta");
		expect(screen.getByLabelText("Sort")).toHaveValue("rating");
		expect(within(screen.getByRole("navigation", { name: "Saved recipe pages" })).getByRole("status")).toHaveTextContent("Page 2 of 4");
		expect(axios.get).toHaveBeenCalledWith("/users/me/wishlist", {
			params: { page: 2, limit: 12, search: "pasta", sort: "rating" },
		});

		await user.click(screen.getByRole("button", { name: "Next page" }));
		await waitFor(() => expect(screen.getByTestId("route-search")).toHaveTextContent("page=3"));
		await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/users/me/wishlist", {
			params: { page: 3, limit: 12, search: "pasta", sort: "rating" },
		}));
	});

	it("shows a search empty state without dropping URL state", async () => {
		const user = userEvent.setup();
		vi.mocked(axios.get).mockResolvedValue({
			data: {
				wishlist: [],
				pagination: { page: 1, limit: 12, total: 0, totalPages: 1, hasNext: false },
			},
		});
		renderWishlist("/wishlist?page=4&search=missing&sort=name");

		await screen.findByRole("heading", { name: "No saved recipes match your search" });
		expect(screen.getByLabelText("Search")).toHaveValue("missing");
		expect(within(screen.getByRole("navigation", { name: "Saved recipe pages" })).getByRole("status")).toHaveTextContent("Page 1 of 1 · 0 saved recipes");
		await waitFor(() => expect(screen.getByTestId("route-search")).toHaveTextContent("page=1"));
		expect(screen.getByTestId("route-search")).toHaveTextContent("search=missing");

		await user.click(screen.getByRole("button", { name: "Clear search" }));
		await waitFor(() => expect(screen.getByTestId("route-search")).not.toHaveTextContent("search="));
		expect(screen.getByTestId("route-search")).toHaveTextContent("sort=name");
	});

	it("resets the page when search or sort changes", async () => {
		const user = userEvent.setup();
		vi.mocked(axios.get).mockImplementation((_url, config) => {
			const params = config?.params as { page?: number } | undefined;
			const page = Number(params?.page ?? 1);
			return Promise.resolve({
				data: {
					wishlist: recipes.map((recipe) => ({ recipe, savedAt: "2026-08-23T06:30:00.000Z" })),
					pagination: { page, limit: 12, total: 37, totalPages: 4, hasNext: page < 4 },
				},
				status: 200,
				statusText: "OK",
				headers: {},
				config: { headers: {} },
			} as unknown as AxiosResponse<unknown>);
		});
		renderWishlist("/wishlist?page=3");
		await screen.findByRole("button", { name: "Next page" });

		fireEvent.change(screen.getByLabelText("Search"), { target: { value: "pasta" } });
		await waitFor(() => expect(screen.getByTestId("route-search")).toHaveTextContent("page=1"));
		await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/users/me/wishlist", {
			params: { page: 1, limit: 12, search: "pasta", sort: "recent" },
		}));

		await user.selectOptions(screen.getByLabelText("Sort"), "rating");
		await waitFor(() => expect(screen.getByTestId("route-search")).toHaveTextContent("sort=rating"));
		await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/users/me/wishlist", {
			params: { page: 1, limit: 12, search: "pasta", sort: "rating" },
		}));
	});

	it("ignores an older wishlist response when a newer search has completed", async () => {
		const user = userEvent.setup();
		const pendingResponses: Array<(response: AxiosResponse<unknown>) => void> = [];
		vi.mocked(axios.get).mockImplementation(() => new Promise((resolve) => pendingResponses.push(resolve)));
		renderWishlist();

		const search = await screen.findByLabelText("Search");
		await user.type(search, "p");
		await waitFor(() => expect(pendingResponses).toHaveLength(2));

		const responseFor = (recipe: RecipeSummary): AxiosResponse<unknown> => ({
			data: {
				wishlist: [{ recipe, savedAt: "2026-08-23T06:30:00.000Z" }],
				pagination: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false },
			},
			status: 200,
			statusText: "OK",
			headers: {},
			config: { headers: {} },
		}) as unknown as AxiosResponse<unknown>;
		const pastaRecipe = { ...recipes[0], recipe_id: 8, recipe_name: "Pasta Primavera" };
		const firstRecipe = { ...recipes[1], recipe_id: 9, recipe_name: "First response" };
		pendingResponses[1](responseFor(pastaRecipe));
		await screen.findByRole("button", { name: "Remove Pasta Primavera" });

		pendingResponses[0](responseFor(firstRecipe));
		await waitFor(() => expect(screen.getByRole("button", { name: "Remove Pasta Primavera" })).toBeInTheDocument());
		expect(screen.queryByRole("button", { name: "Remove First response" })).not.toBeInTheDocument();
	});

	it("moves back a page when removing the only recipe on the final page", async () => {
		const user = userEvent.setup();
		vi.mocked(axios.get)
			.mockResolvedValueOnce({ data: { wishlist: [{ recipe: recipes[0], savedAt: "2026-08-23T06:30:00.000Z" }], pagination: { page: 3, limit: 12, total: 25, totalPages: 3, hasNext: false } } })
			.mockResolvedValueOnce({ data: { wishlist: [{ recipe: recipes[1], savedAt: "2026-08-22T06:30:00.000Z" }], pagination: { page: 2, limit: 12, total: 24, totalPages: 2, hasNext: false } } });
		vi.mocked(axios.delete).mockResolvedValue({ status: 200, statusText: "OK", headers: {}, config: { headers: {} }, data: {} });
		renderWishlist("/saved?page=3");
		await screen.findByRole("button", { name: "Remove First recipe" });

		await user.click(screen.getByRole("button", { name: "Remove First recipe" }));
		await user.click(screen.getByRole("button", { name: "Remove" }));

		await waitFor(() => expect(screen.getByTestId("route-search")).toHaveTextContent("page=2"));
		await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith("/users/me/wishlist", {
			params: { page: 2, limit: 12, sort: "recent" },
		}));
		await screen.findByRole("button", { name: "Remove Second recipe" });
	});
});
