// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrivateRecipeNotes from "./PrivateRecipeNotes";

const mutate = vi.fn();

vi.mock("@/features/recipes/api/notesQueries", () => ({
	useRecipeNoteQuery: () => ({ data: { note: { note: "Use less salt" } }, isLoading: false, isError: false }),
	useSaveRecipeNoteMutation: () => ({ mutate, isPending: false }),
	useDeleteRecipeNoteMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("PrivateRecipeNotes", () => {
	afterEach(() => {
		cleanup();
		mutate.mockClear();
	});

	it("loads a private note and saves edited text", () => {
		render(<PrivateRecipeNotes recipeId={15} isAuthenticated />);

		const input = screen.getByLabelText("Private notes");
		expect(input).toHaveValue("Use less salt");
		fireEvent.change(input, { target: { value: "Air fryer: 180°C." } });
		fireEvent.click(screen.getByRole("button", { name: "Save note" }));

		expect(mutate).toHaveBeenCalledWith({ recipeId: 15, note: "Air fryer: 180°C." }, expect.any(Object));
	});

	it("does not render for guests", () => {
		render(<PrivateRecipeNotes recipeId={15} isAuthenticated={false} />);
		expect(screen.queryByRole("heading", { name: "My notes" })).not.toBeInTheDocument();
	});
});
