export type CookingToolsState = {
	checkedIngredients: number[];
	timerDurationSeconds: number;
	timerRemainingSeconds: number;
	timerIsRunning: boolean;
	timerEndsAt: number | null;
};

const STORAGE_PREFIX = "food-recipes:cooking-tools";
export const DEFAULT_TIMER_SECONDS = 15 * 60;

const getStorage = (): Storage | null => {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
};

export const getCookingToolsStorageKey = (
	userId: number | string,
	recipeId: number | string,
): string => `${STORAGE_PREFIX}:${userId || "guest"}:${recipeId}`;

export const defaultCookingToolsState = (): CookingToolsState => ({
	checkedIngredients: [],
	timerDurationSeconds: DEFAULT_TIMER_SECONDS,
	timerRemainingSeconds: DEFAULT_TIMER_SECONDS,
	timerIsRunning: false,
	timerEndsAt: null,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const safeSeconds = (value: unknown, fallback: number): number => {
	const seconds = Number(value);
	return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 120 * 60) : fallback;
};

export const readCookingToolsState = (key: string | null): CookingToolsState => {
	const defaults = defaultCookingToolsState();
	const storage = getStorage();
	if (!storage || !key) return defaults;

	try {
		const parsed: unknown = JSON.parse(storage.getItem(key) || "null");
		if (!isRecord(parsed)) return defaults;
		const timerDurationSeconds = safeSeconds(parsed.timerDurationSeconds, defaults.timerDurationSeconds) || defaults.timerDurationSeconds;
		let timerRemainingSeconds = safeSeconds(parsed.timerRemainingSeconds, timerDurationSeconds);
		let timerIsRunning = parsed.timerIsRunning === true;
		const timerEndsAt = typeof parsed.timerEndsAt === "number" && Number.isFinite(parsed.timerEndsAt) ? parsed.timerEndsAt : null;
		if (timerIsRunning && timerEndsAt !== null) {
			timerRemainingSeconds = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
			timerIsRunning = timerRemainingSeconds > 0;
		}
		return {
			checkedIngredients: Array.isArray(parsed.checkedIngredients)
				? parsed.checkedIngredients.filter((value): value is number => Number.isInteger(value) && value >= 0)
				: [],
			timerDurationSeconds,
			timerRemainingSeconds,
			timerIsRunning,
			timerEndsAt: timerIsRunning ? timerEndsAt : null,
		};
	} catch {
		return defaults;
	}
};

export const writeCookingToolsState = (key: string | null, state: CookingToolsState): void => {
	const storage = getStorage();
	if (!storage || !key) return;
	try {
		storage.setItem(key, JSON.stringify(state));
	} catch {
		// Browser storage is an optional resume layer.
	}
};

export const clearCookingToolsState = (key: string | null): void => {
	const storage = getStorage();
	if (!storage || !key) return;
	try {
		storage.removeItem(key);
	} catch {
		// Ignore storage cleanup failures.
	}
};
