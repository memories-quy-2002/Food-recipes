// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JournalForm from "./JournalForm";

const api = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), upload: vi.fn() }));
vi.mock("./api/journalApi", () => ({ getJournal: api.get, saveJournal: api.save, uploadJournalPhoto: api.upload }));

describe("JournalForm", () => {
	beforeEach(() => { api.get.mockResolvedValue({ journal: null }); api.save.mockResolvedValue({ journal: {} }); api.upload.mockResolvedValue("journals/7/photo.webp"); });
	afterEach(() => { cleanup(); vi.clearAllMocks(); });

	it("loads and saves private rating, repeat choice, and notes", async () => {
		const user = userEvent.setup();
		render(<JournalForm historyId={8} />);
		await screen.findByRole("button", { name: "Save journal" });
		await user.selectOptions(screen.getByLabelText("Your rating"), "5");
		await user.click(screen.getByText("Would cook this again"));
		await user.type(screen.getByLabelText("Private notes"), "Less salt next time");
		await user.click(screen.getByRole("button", { name: "Save journal" }));
		expect(api.save).toHaveBeenCalledWith(8, { rating: 5, wouldCookAgain: true, notes: "Less salt next time", photos: [] });
	});

	it("keeps text draft when a photo upload fails", async () => {
		const user = userEvent.setup();
		api.upload.mockRejectedValue(new Error("Photo upload failed. Your journal text is still here."));
		render(<JournalForm historyId={8} />);
		await screen.findByRole("button", { name: "Save journal" });
		await user.type(screen.getByLabelText("Private notes"), "Keep this note");
		const file = new File(["image"], "dish.png", { type: "image/png" });
		await user.upload(screen.getByLabelText("Photos"), file);
		expect(await screen.findByRole("alert")).toHaveTextContent("text is still here");
		expect(screen.getByDisplayValue("Keep this note")).toBeInTheDocument();
	});
});
