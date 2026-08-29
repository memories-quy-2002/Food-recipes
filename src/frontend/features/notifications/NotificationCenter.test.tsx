// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationCenter from "./NotificationCenter";

const mocks = vi.hoisted(() => ({
	useNotificationsQuery: vi.fn(),
	useMarkNotificationReadMutation: vi.fn(),
	useMarkAllNotificationsReadMutation: vi.fn(),
}));

vi.mock("./api/notificationsQueries", () => mocks);

describe("NotificationCenter", () => {
	beforeEach(() => {
		mocks.useNotificationsQuery.mockReturnValue({ data: { notifications: [
			{ notification_id: 1, title: "Use spinach soon", body: "It expires tomorrow.", action_path: "/pantry", read_at: null, created_at: "2026-08-28T08:00:00Z" },
			{ notification_id: 2, title: "Plan tonight's meal", body: null, action_path: "/planning", read_at: "2026-08-27T08:00:00Z", created_at: "2026-08-27T08:00:00Z" },
		] }, isPending: false });
		mocks.useMarkNotificationReadMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
		mocks.useMarkAllNotificationsReadMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	afterEach(() => { cleanup(); vi.clearAllMocks(); });

	it("shows unread count and links notifications to the internal action", () => {
		render(<MemoryRouter><NotificationCenter /></MemoryRouter>);
		expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
		expect(screen.getByText("Use spinach soon")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Use spinach soon" })).toHaveAttribute("href", "/pantry");
	});

	it("marks all notifications read from the open panel", () => {
		const markAll = vi.fn();
		mocks.useMarkAllNotificationsReadMutation.mockReturnValue({ mutate: markAll, isPending: false });
		render(<MemoryRouter><NotificationCenter /></MemoryRouter>);
		fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
		fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
		expect(markAll).toHaveBeenCalledOnce();
	});
});
