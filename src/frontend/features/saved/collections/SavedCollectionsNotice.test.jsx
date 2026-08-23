// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SavedCollectionsNotice from "./SavedCollectionsNotice";

describe("SavedCollectionsNotice", () => {
	it("states that collections are unavailable while keeping All saved available", () => {
		render(<SavedCollectionsNotice />);

		expect(
			screen.getByRole("heading", { name: "Collections are unavailable" })
		).toBeInTheDocument();
		expect(screen.getByText("All saved", { selector: "strong" })).toBeInTheDocument();
		expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
	});
});
