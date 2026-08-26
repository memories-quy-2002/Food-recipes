// @vitest-environment jsdom
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AccountForm from "./AccountForm";
import {
	beginAuthIntent,
	getAuthIntentSnapshot,
	STORAGE_KEY,
} from "@/features/auth/returnIntent";

vi.mock("./LoginForm", () => ({ default: () => <div>Login form</div> }));
vi.mock("./SignupForm", () => ({ default: () => <div>Signup form</div> }));

type MemoryStorage = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
};

const createStorage = (): MemoryStorage => {
	const values = new Map<string, string>();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
		clear: () => values.clear(),
	};
};

const originalWindow = globalThis.window;

describe("AccountForm auth-intent cleanup", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: {
				location: { origin: "http://localhost" },
				sessionStorage: createStorage(),
			},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: originalWindow,
		});
	});

	it("preserves an unchanged intent through StrictMode replay but clears it after a real unmount", () => {
		beginAuthIntent({
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: 7,
		});
		const enteredSnapshot = getAuthIntentSnapshot();
		let renderer: ReactTestRenderer | undefined;

		act(() => {
			renderer = TestRenderer.create(
				<React.StrictMode>
					<MemoryRouter initialEntries={["/account"]}>
						<AccountForm />
					</MemoryRouter>
				</React.StrictMode>,
			);
		});

		act(() => {
			vi.runOnlyPendingTimers();
		});
		expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe(enteredSnapshot);

		if (!renderer) throw new Error("Expected the account form renderer");
		act(() => renderer?.unmount());
		act(() => {
			vi.runOnlyPendingTimers();
		});
		expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});
