// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProfileAside from "./ProfileAside";
import ProfileMain from "./ProfileMain";

describe("Profile responsive and accessibility behavior", () => {
	afterEach(() => cleanup());

	it("exposes one profile navigation landmark and active section", () => {
		render(
			<MemoryRouter>
				<ProfileAside name="Alex" page="overview" handleLogOut={() => undefined} handleChangePage={() => undefined} />
			</MemoryRouter>,
		);

		expect(screen.getByRole("navigation", { name: "Profile sections" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
	});

	it("keeps the mobile menu closed until requested and closes after selection", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<ProfileAside name="Alex" page="overview" handleLogOut={() => undefined} handleChangePage={() => undefined} />
			</MemoryRouter>,
		);

		const menuButton = screen.getByRole("button", { name: /Profile menu/ });
		expect(menuButton).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByRole("navigation", { name: "Profile sections" })).toHaveClass("hidden");

		await user.click(menuButton);
		expect(menuButton).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("navigation", { name: "Profile sections" })).not.toHaveClass("hidden");

		await user.click(screen.getByRole("link", { name: "My recipes" }));
		expect(menuButton).toHaveAttribute("aria-expanded", "false");
	});

	it("moves focus to the new profile section after navigation", async () => {
		const { rerender } = render(
			<MemoryRouter>
				<ProfileMain user={{ user_id: 1, full_name: "Alex" }} page="overview" />
			</MemoryRouter>,
		);

		rerender(
			<MemoryRouter>
				<ProfileMain user={{ user_id: 1, full_name: "Alex" }} page="password" />
			</MemoryRouter>,
		);

		await waitFor(() => expect(screen.getByRole("region", { name: "Profile content" })).toHaveFocus());
	});
});
