// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PersonalRecipes from "./PersonalRecipes";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), del: vi.fn() }));
const { get, post, del } = mocks;

vi.mock("@/shared/api/axios", () => ({ default: { get: mocks.get, post: mocks.post, delete: mocks.del } }));

describe("PersonalRecipes lifecycle controls", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		get.mockResolvedValue({ data: { recipes: [{ recipe_id: 5, recipe_name: "Soup", status: "draft", category_name: "Dinner", meal_name: "Main course" }] } });
		post.mockResolvedValue({ status: 200, data: { recipe: { recipe_id: 5, status: "published" } } });
		del.mockResolvedValue({ status: 204 });
	});

	afterEach(() => cleanup());

	it("filters by status and publishes an owner draft, then refreshes", async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><PersonalRecipes user={{ user_id: 1 }} /></MemoryRouter>);

		expect(await screen.findByText("Draft")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Publish recipe Soup" })).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Published" }));
		expect(screen.getByText("No published recipes yet.")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "All" }));
		await user.click(screen.getByRole("button", { name: "Publish recipe Soup" }));
		await waitFor(() => expect(post).toHaveBeenCalledWith("/recipes/5/publish"));
		await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
	});
});
