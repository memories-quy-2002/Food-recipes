// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Reviews from "./Reviews";
import ProfileOverview from "./ProfileOverview";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/shared/api/axios", () => ({ default: { get: mocks.get } }));

describe("profile review loading", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mocks.get.mockResolvedValue({ data: { ratings: [] } });
	});

	afterEach(() => cleanup());

	it("loads ratings when the Reviews section is mounted", async () => {
		render(<MemoryRouter><Reviews /></MemoryRouter>);

		await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("/users/me/ratings"));
	});

	it("does not require ratings to render Overview", () => {
		render(<MemoryRouter><ProfileOverview user={{ user_id: 1 }} /></MemoryRouter>);

		expect(mocks.get).not.toHaveBeenCalled();
		expect(screen.getByRole("heading", { name: "Your kitchen" })).toBeInTheDocument();
	});
});
