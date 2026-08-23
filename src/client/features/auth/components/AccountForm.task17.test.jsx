import React from "react";
import TestRenderer, { act } from "react-test-renderer";
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

const createStorage = () => {
	const values = new Map();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
		clear: () => values.clear(),
	};
};

describe("AccountForm auth-intent cleanup", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		globalThis.window = {
			location: { origin: "http://localhost" },
			sessionStorage: createStorage(),
		};
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("preserves an unchanged intent through StrictMode replay but clears it after a real unmount", () => {
		beginAuthIntent({
			returnTo: "/recipe?id=7",
			action: "saveRecipe",
			recipeId: 7,
		});
		const enteredSnapshot = getAuthIntentSnapshot();
		let renderer;

		act(() => {
			renderer = TestRenderer.create(
				<React.StrictMode>
					<MemoryRouter initialEntries={["/account"]}>
						<AccountForm />
					</MemoryRouter>
				</React.StrictMode>
			);
		});

		act(() => {
			vi.runOnlyPendingTimers();
		});
		expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe(enteredSnapshot);

		act(() => renderer.unmount());
		act(() => {
			vi.runOnlyPendingTimers();
		});
		expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});
