// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HouseholdsPage from "./HouseholdsPage";

const mocks = vi.hoisted(() => ({
	useHouseholdsQuery: vi.fn(),
	useCreateHouseholdMutation: vi.fn(),
	useCreateHouseholdInviteMutation: vi.fn(),
	useAcceptHouseholdInviteMutation: vi.fn(),
}));

vi.mock("./api/householdsQueries", () => mocks);

const renderPage = (path = "/households") => render(<MemoryRouter initialEntries={[path]}><HouseholdsPage /></MemoryRouter>);

describe("HouseholdsPage", () => {
	beforeEach(() => {
		mocks.useHouseholdsQuery.mockReturnValue({ data: { households: [{ household_id: 12, name: "Smith Household", role: "OWNER" }] }, isPending: false, isError: false });
		mocks.useCreateHouseholdMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
		mocks.useCreateHouseholdInviteMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
		mocks.useAcceptHouseholdInviteMutation.mockReturnValue({ mutate: vi.fn((_token: string, options: { onError: () => void }) => options.onError()), isPending: false });
	});

	afterEach(() => { cleanup(); vi.clearAllMocks(); });

	it("shows household membership and owner invite controls", () => {
		renderPage();
		expect(screen.getByRole("heading", { name: "Household kitchens" })).toBeInTheDocument();
		expect(screen.getByText("Smith Household")).toBeInTheDocument();
		expect(screen.getByLabelText("Invite email")).toBeInTheDocument();
	});

	it("surfaces an invalid or expired invite without losing the token draft", async () => {
		renderPage("/households?invite=expired-token");
		expect(screen.getByDisplayValue("expired-token")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));
		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("invalid, expired, or already used"));
		expect(screen.getByDisplayValue("expired-token")).toBeInTheDocument();
	});
});
