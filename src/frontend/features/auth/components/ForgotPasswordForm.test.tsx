// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordForm from "./ForgotPasswordForm";

const mocks = vi.hoisted(() => ({
	requestPasswordReset: vi.fn(),
	getSafeAuthErrorMessage: vi.fn(
		(_error: unknown, fallback: string) => fallback,
	),
}));

vi.mock("@/features/auth/api/passwordRecoveryApi", () => mocks);

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ForgotPasswordForm", () => {
	it("shows generic recovery copy after a successful request", async () => {
		const user = userEvent.setup();
		mocks.requestPasswordReset.mockResolvedValue({
			message: "If the account exists, recovery instructions will be sent.",
		});

		render(<ForgotPasswordForm onLogin={vi.fn()} />);
		await user.type(
			screen.getByLabelText("Email address"),
			"cook@example.test",
		);
		await user.click(
			screen.getByRole("button", {
			name: "Send recovery instructions",
		}),
		);

		expect(mocks.requestPasswordReset).toHaveBeenCalledWith(
			"cook@example.test",
		);
		expect(await screen.findByRole("status")).toHaveTextContent(
			/if an account matches that email/i,
		);
	});

	it("validates the email before making a request", async () => {
		const user = userEvent.setup();
		render(<ForgotPasswordForm onLogin={vi.fn()} />);

		await user.click(
			screen.getByRole("button", {
				name: "Send recovery instructions",
			}),
		);

		const email = screen.getByLabelText("Email address");
		expect(email).toHaveAttribute("aria-invalid", "true");
		expect(email).toHaveAttribute(
			"aria-describedby",
			"forgot-password-email-error",
		);
		expect(screen.getByText("Email is required.")).toBeInTheDocument();
		expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
	});

	it("keeps the submit action pending while the request is unresolved", async () => {
		const user = userEvent.setup();
		mocks.requestPasswordReset.mockReturnValue(new Promise(() => undefined));
		render(<ForgotPasswordForm onLogin={vi.fn()} />);

		await user.type(
			screen.getByLabelText("Email address"),
			"cook@example.test",
		);
		const submit = screen.getByRole("button", {
			name: "Send recovery instructions",
		});
		await user.click(submit);

		expect(submit).toBeDisabled();
		expect(
			screen.getByRole("button", {
				name: "Sending recovery instructions...",
			}),
		).toBeDisabled();
	});

	it("uses safe fallback copy when the request fails", async () => {
		const user = userEvent.setup();
		mocks.requestPasswordReset.mockRejectedValue(new Error("offline"));
		render(<ForgotPasswordForm onLogin={vi.fn()} />);

		await user.type(
			screen.getByLabelText("Email address"),
			"cook@example.test",
		);
		await user.click(
			screen.getByRole("button", {
				name: "Send recovery instructions",
			}),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/could not request recovery instructions/i,
		);
	});
});
