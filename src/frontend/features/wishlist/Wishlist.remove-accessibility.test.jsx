// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Wishlist from "./Wishlist";
import { RecipeContext } from "@/app/RecipeProvider";
import axios from "@/shared/api/axios";

vi.mock("@/shared/api/axios", () => ({
	default: { get: vi.fn(), delete: vi.fn() },
}));

vi.mock("react-redux", () => ({
	useSelector: (selector) =>
		selector({
			auth: {
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

const recipes = [
	{ recipe_id: 1, recipe_name: "First recipe", overall_score: 4, num_ratings: 1 },
	{ recipe_id: 2, recipe_name: "Second recipe", overall_score: 5, num_ratings: 2 },
];

const renderWishlist = () =>
	render(
		<MemoryRouter initialEntries={["/saved"]}>
			<RecipeContext.Provider
				value={{ recipes, isLoadingRecipes: false, recipesError: null }}
			>
				<Wishlist />
			</RecipeContext.Provider>
		</MemoryRouter>,
		{ container: Object.assign(document.body.appendChild(document.createElement("div")), { id: "root" }) }
	);

describe("Wishlist remove confirmation accessibility", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		axios.get.mockResolvedValue({ data: { wishlist: recipes } });
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
		let resolveDelete;
		axios.delete.mockImplementation(
			() => new Promise((resolve) => {
				resolveDelete = resolve;
			})
		);
		renderWishlist();
		await screen.findByRole("button", { name: "Remove First recipe" });

		await user.click(screen.getAllByRole("button", { name: "Remove First recipe" })[0]);
		await user.click(screen.getByRole("button", { name: "Remove" }));
		fireEvent.click(screen.getByRole("button", { name: "Removing…" }));

		expect(axios.delete).toHaveBeenCalledTimes(1);
		expect(axios.delete).toHaveBeenCalledWith("/users/me/wishlist/1");
		resolveDelete({ status: 200 });
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("keeps the dialog open and recovers after a remove error", async () => {
		const user = userEvent.setup();
		axios.delete.mockRejectedValueOnce({ response: { data: { message: "Remove failed" } } });
		renderWishlist();
		await screen.findByRole("button", { name: "Remove First recipe" });

		await user.click(screen.getAllByRole("button", { name: "Remove First recipe" })[0]);
		await user.click(screen.getByRole("button", { name: "Remove" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Remove failed");
		expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
});
