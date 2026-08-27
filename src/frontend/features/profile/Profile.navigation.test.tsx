// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProfileAside from "./ProfileAside";
import ProfileOverview from "./ProfileOverview";
import { getProfilePageFromHash } from "./Profile";

describe("profile navigation", () => {
	afterEach(() => cleanup());

	it("maps the new and legacy hashes without changing named sections", () => {
		expect(getProfilePageFromHash()).toBe("overview");
		expect(getProfilePageFromHash("#/" )).toBe("personal-info");
		expect(getProfilePageFromHash("#/personal-info")).toBe("personal-info");
		expect(getProfilePageFromHash("#/password")).toBe("password");
		expect(getProfilePageFromHash("#/recipes")).toBe("recipes");
		expect(getProfilePageFromHash("#/reviews")).toBe("reviews");
	});

	it("renders grouped section links", () => {
		render(
			<MemoryRouter>
				<ProfileAside
					name="Alex"
					page="overview"
					handleLogOut={() => undefined}
					handleChangePage={() => undefined}
				/>
			</MemoryRouter>,
		);

		expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/profile");
		expect(screen.getByRole("link", { name: "Personal info" })).toHaveAttribute("href", "/profile#/personal-info");
		expect(screen.getByRole("link", { name: "Change password" })).toHaveAttribute("href", "/profile#/password");
	});

	it("renders Overview actions using existing protected routes", () => {
		render(
			<MemoryRouter>
				<ProfileOverview user={{ user_id: 1, full_name: "Alex", email: "alex@example.com" }} />
			</MemoryRouter>,
		);

		expect(screen.getByRole("link", { name: "Add a recipe" })).toHaveAttribute("href", "/food/add");
		expect(screen.getByRole("link", { name: "View saved recipes" })).toHaveAttribute("href", "/wishlist");
		expect(screen.getByRole("link", { name: /My recipes/ })).toHaveAttribute("href", "/profile#/recipes");
		expect(screen.getByRole("link", { name: /Meal planning/ })).toHaveAttribute("href", "/planning");
	});
});
