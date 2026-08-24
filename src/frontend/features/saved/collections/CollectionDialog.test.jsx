// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CollectionDialog from "./CollectionDialog";

describe("CollectionDialog", () => {
	afterEach(cleanup);
	it("validates and trims a collection name before submitting", () => {
		const onSubmit = vi.fn();
		render(<CollectionDialog open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

		fireEvent.change(screen.getByLabelText("Collection name"), { target: { value: "  Weeknight dinners  " } });
		fireEvent.submit(screen.getByRole("dialog").querySelector("form"));

		expect(onSubmit).toHaveBeenCalledWith("Weeknight dinners");
	});

	it("shows the rename title and does not submit blank names", () => {
		const onSubmit = vi.fn();
		render(<CollectionDialog open mode="rename" initialName="Favorites" onClose={vi.fn()} onSubmit={onSubmit} />);

		expect(screen.getByRole("heading", { name: "Rename collection" })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Collection name"), { target: { value: "   " } });
		fireEvent.submit(screen.getByRole("dialog").querySelector("form"));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toHaveTextContent("Enter a collection name");
	});
});
