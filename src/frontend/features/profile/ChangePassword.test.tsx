// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChangePassword from "./ChangePassword";

const mocks = vi.hoisted(() => ({
	put: vi.fn(),
	showToast: vi.fn(),
}));

vi.mock("@/shared/api/axios", () => ({ default: { put: mocks.put } }));
vi.mock("@/app/ToastProvider", () => ({
	useToast: () => ({ showToast: mocks.showToast }),
}));

describe("ChangePassword", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		mocks.put.mockResolvedValue({ status: 200 });
	});

	afterEach(() => cleanup());

	it("provides password visibility controls", async () => {
		const user = userEvent.setup();
		render(<ChangePassword />);

		expect(screen.getByText(/Minimum 8 characters/)).toBeInTheDocument();
		const current = screen.getByLabelText("Current password");
		expect(current).toHaveAttribute("type", "password");

		await user.click(screen.getByRole("button", { name: "Show current password" }));
		expect(current).toHaveAttribute("type", "text");
	});

	it("locks the submit action while the password request is pending", async () => {
		let resolveRequest: (value: { status: number }) => void = () => undefined;
		mocks.put.mockReturnValue(new Promise((resolve) => {
			resolveRequest = resolve;
		}));
		const user = userEvent.setup();
		render(<ChangePassword />);

		await user.type(screen.getByLabelText("Current password"), "old-password");
		await user.type(screen.getByLabelText("New password"), "new-password");
		await user.type(screen.getByLabelText("Confirm new password"), "new-password");
		const submit = screen.getByRole("button", { name: "Save new password" });
		await user.click(submit);

		expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
		resolveRequest({ status: 200 });
		await waitFor(() => expect(screen.getByRole("button", { name: "Save new password" })).toBeDisabled());
	});

	it("keeps the form and exposes the server error when the current password is invalid", async () => {
		const error = new AxiosError("Unauthorized");
		error.response = {
			status: 401,
			statusText: "Unauthorized",
			headers: {},
			config: { headers: {} },
			data: { message: "The current password is incorrect" },
		} as AxiosResponse;
		mocks.put.mockRejectedValue(error);
		const user = userEvent.setup();
		render(<ChangePassword />);

		await user.type(screen.getByLabelText("Current password"), "old-password");
		await user.type(screen.getByLabelText("New password"), "new-password");
		await user.type(screen.getByLabelText("Confirm new password"), "new-password");
		await user.click(screen.getByRole("button", { name: "Save new password" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("current password is incorrect");
		expect(screen.getByLabelText("Current password")).toHaveValue("old-password");
	});
});
