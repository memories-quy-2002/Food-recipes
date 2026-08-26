import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearAccessToken,
	getAccessToken,
	setAccessToken,
} from "./authTokenStore";

const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

afterEach(() => {
	clearAccessToken();
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: originalLocalStorage,
	});
	Object.defineProperty(globalThis, "sessionStorage", {
		configurable: true,
		value: originalSessionStorage,
	});
	vi.restoreAllMocks();
});

describe("auth access-token store", () => {
	it("keeps the access token in module memory and clears it", () => {
		setAccessToken("memory-token");

		expect(getAccessToken()).toBe("memory-token");

		clearAccessToken();

		expect(getAccessToken()).toBeNull();
	});

	it("never accesses browser storage", () => {
		const getItem = vi.fn();
		const setItem = vi.fn();
		const removeItem = vi.fn();
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			value: { getItem, setItem, removeItem },
		});
		Object.defineProperty(globalThis, "sessionStorage", {
			configurable: true,
			value: { getItem, setItem, removeItem },
		});

		setAccessToken("memory-token");
		getAccessToken();
		clearAccessToken();

		expect(getItem).not.toHaveBeenCalled();
		expect(setItem).not.toHaveBeenCalled();
		expect(removeItem).not.toHaveBeenCalled();
	});
});
