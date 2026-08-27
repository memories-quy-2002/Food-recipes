// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PersonalInfo from "./PersonalInfo";

const mocks = vi.hoisted(() => ({
	put: vi.fn(),
	dispatch: vi.fn(),
	showToast: vi.fn(),
}));

vi.mock("@/shared/api/axios", () => ({ default: { put: mocks.put } }));
vi.mock("react-redux", () => ({ useDispatch: () => mocks.dispatch }));
vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast: mocks.showToast }),
}));

const profile = {
	user_id: 1,
	full_name: "Alex",
	email: "alex@example.com",
	phone: "555-0100",
	address: "12 Kitchen Street",
};

describe("PersonalInfo", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mocks.put.mockResolvedValue({ status: 200, data: profile });
	});

	afterEach(() => cleanup());

	it("shows email as read-only and enables save only after a change", async () => {
		const user = userEvent.setup();
		render(<PersonalInfo user={profile} />);

		const save = screen.getByRole("button", { name: "Save changes" });
		expect(screen.getByDisplayValue("alex@example.com")).toHaveAttribute("readonly");
		expect(save).toBeDisabled();

		await user.clear(screen.getByLabelText("Full name"));
		expect(save).toBeEnabled();
	});

	it("restores the last saved values when cancel is pressed", async () => {
		const user = userEvent.setup();
		render(<PersonalInfo user={profile} />);

		await user.clear(screen.getByLabelText("Full name"));
		await user.type(screen.getByLabelText("Full name"), "Changed");
		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(screen.getByLabelText("Full name")).toHaveValue("Alex");
		expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
	});

	it("updates the auth user after a successful save", async () => {
		const user = userEvent.setup();
		render(<PersonalInfo user={profile} />);

		await user.clear(screen.getByLabelText("Full name"));
		await user.type(screen.getByLabelText("Full name"), "Changed");
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(mocks.put).toHaveBeenCalledWith("/users/me/profile", {
			name: "Changed",
			address: "12 Kitchen Street",
			phoneNumber: "555-0100",
		});
		expect(mocks.dispatch).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
	});

	it("keeps edited values when saving fails", async () => {
		mocks.put.mockRejectedValue(new Error("network error"));
		const user = userEvent.setup();
		render(<PersonalInfo user={profile} />);

		await user.clear(screen.getByLabelText("Full name"));
		await user.type(screen.getByLabelText("Full name"), "Changed");
		await user.click(screen.getByRole("button", { name: "Save changes" }));

		expect(screen.getByLabelText("Full name")).toHaveValue("Changed");
		expect(mocks.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
	});
});
