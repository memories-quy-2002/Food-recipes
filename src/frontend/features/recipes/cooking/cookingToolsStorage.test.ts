// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
	getCookingToolsStorageKey,
	readCookingToolsState,
	writeCookingToolsState,
} from "./cookingToolsStorage";

describe("cooking tools storage", () => {
	beforeEach(() => window.localStorage.clear());

	it("keeps checklist and timer state scoped to a user and recipe", () => {
		const key = getCookingToolsStorageKey(7, 42);
		writeCookingToolsState(key, {
			checkedIngredients: [0, 2],
			timerDurationSeconds: 600,
			timerRemainingSeconds: 245,
			timerIsRunning: false,
			timerEndsAt: null,
		});

		expect(readCookingToolsState(key)).toMatchObject({
			checkedIngredients: [0, 2],
			timerRemainingSeconds: 245,
		});
		expect(readCookingToolsState(getCookingToolsStorageKey(8, 42)).checkedIngredients).toEqual([]);
	});

	it("recalculates a running timer after the user returns", () => {
		const key = getCookingToolsStorageKey("guest", 42);
		writeCookingToolsState(key, {
			checkedIngredients: [],
			timerDurationSeconds: 600,
			timerRemainingSeconds: 600,
			timerIsRunning: true,
			timerEndsAt: Date.now() - 1,
		});

		expect(readCookingToolsState(key)).toMatchObject({
			timerRemainingSeconds: 0,
			timerIsRunning: false,
			timerEndsAt: null,
		});
	});
});
