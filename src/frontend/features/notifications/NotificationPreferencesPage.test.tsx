// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationPreferencesPage from "./NotificationPreferencesPage";

const mocks = vi.hoisted(() => ({ useNotificationPreferencesQuery: vi.fn(), useUpdateNotificationPreferencesMutation: vi.fn() }));
vi.mock("./api/notificationsQueries", () => mocks);

describe("NotificationPreferencesPage", () => {
	beforeEach(() => {
		mocks.useNotificationPreferencesQuery.mockReturnValue({ data: { preferences: { pantryExpiry: true, mealReminder: true, resumeCooking: false, weeklyPlan: true, householdActivity: true } }, isPending: false });
		mocks.useUpdateNotificationPreferencesMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});
	afterEach(() => { cleanup(); vi.clearAllMocks(); });

	it("renders preference toggles and saves the changed value", () => {
		const mutate = vi.fn();
		mocks.useUpdateNotificationPreferencesMutation.mockReturnValue({ mutate, isPending: false });
		render(<NotificationPreferencesPage />);
		const control = screen.getByRole("checkbox", { name: "Meal reminders" });
		expect(control).toBeChecked();
		fireEvent.click(control);
		fireEvent.click(screen.getByRole("button", { name: "Save notification preferences" }));
		expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ mealReminder: false }));
	});
});
