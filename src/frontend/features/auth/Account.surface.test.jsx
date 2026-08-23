import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Account from "./Account";

vi.mock("./components/AccountForm", () => ({
	default: () => <div>Account form</div>,
}));

vi.mock("@/shared/seo/PageHelmet", () => ({
	default: () => null,
}));

describe("Account surface", () => {
	it("does not use Tailwind's blur utility class for the auth form", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter initialEntries={["/account?login=true"]}>
					<Account />
				</MemoryRouter>
			);
		});

		expect(renderer.root.findByProps({ className: "account__surface" })).toBeTruthy();
		expect(renderer.root.findAllByProps({ className: "blur" })).toHaveLength(0);
	});
});
