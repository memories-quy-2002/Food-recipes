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
		expect(screen.getByRole("button", { name: "Create invite for Smith Household" })).toBeInTheDocument();
	});

	it("surfaces an invalid or expired invite without losing the token draft", async () => {
		renderPage("/households?invite=expired-token");
		expect(screen.getByDisplayValue("expired-token")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Accept invite" }));
		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("invalid, expired, or already used"));
		expect(screen.getByDisplayValue("expired-token")).toBeInTheDocument();
	});

	it("shows a retry state when household membership cannot load", () => {
		const refetch = vi.fn();
		mocks.useHouseholdsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });
		renderPage();

		expect(screen.getByRole("alert")).toHaveTextContent("could not load your households");
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(refetch).toHaveBeenCalledOnce();
		expect(screen.queryByText("You do not belong to a household yet.")).not.toBeInTheDocument();
	});

	it("announces create and invite failures inline", async () => {
		const create = vi.fn((_name: string, options?: { onError?: () => void }) => options?.onError?.());
		const invite = vi.fn((_input: { householdId: number; email: string }, options?: { onError?: () => void }) => options?.onError?.());
		mocks.useCreateHouseholdMutation.mockReturnValue({ mutate: create, isPending: false });
		mocks.useCreateHouseholdInviteMutation.mockReturnValue({ mutate: invite, isPending: false });
		renderPage();

		fireEvent.change(screen.getByLabelText("Create a household"), { target: { value: "New kitchen" } });
		fireEvent.click(screen.getByRole("button", { name: "Create household" }));
		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("could not create your household"));

		fireEvent.change(screen.getByLabelText("Invite email"), { target: { value: "cook@example.com" } });
		fireEvent.click(screen.getByRole("button", { name: "Create invite for Smith Household" }));
		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("could not create this invite"));
		expect(screen.getByDisplayValue("cook@example.com")).toBeInTheDocument();
	});
});
