// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
	it("provides a labeled page heading, supporting copy, and actions", () => {
		render(
			<PageHeader
				eyebrow="Your kitchen"
				title="Pantry"
				description="See what is ready to cook."
				headingId="pantry-title"
				actions={<button type="button">Find recipes</button>}
			/>,
		);

		expect(screen.getByRole("heading", { level: 1, name: "Pantry" })).toHaveAttribute("id", "pantry-title");
		expect(screen.getByText("Your kitchen")).toBeInTheDocument();
		expect(screen.getByText("See what is ready to cook.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Find recipes" })).toBeInTheDocument();
	});
});
