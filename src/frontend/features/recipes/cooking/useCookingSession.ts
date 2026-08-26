import { useCallback, useEffect, useRef, useState } from "react";
import {
	abandonCookingSession,
	completeCookingSession,
	startCookingSession,
	updateCookingSession,
} from "@/features/history/api/cookingSessionApi";
import type {
	CookingSession,
	CookingSessionCompletionResponse,
} from "@/features/history/api/cookingSessionApi";

const STORAGE_PREFIX = "food-recipes:cooking-session";

export type PersistedCookingSession = Pick<
	CookingSession,
	"recipe_id" | "meal_plan_item_id" | "servings" | "current_step"
> & {
	session_id: number | null;
	status: "active" | "paused";
};

export type UseCookingSessionOptions = {
	enabled?: boolean;
	userId?: number | string;
	recipeId?: number | string | null;
	mealPlanItemId?: number | string | null;
	servings?: number | string | null;
};

export type UseCookingSessionResult = {
	session: PersistedCookingSession | null;
	isReady: boolean;
	error: string | null;
	updateProgress: (currentStep: number) => void;
	pause: () => Promise<void>;
	complete: () => Promise<CookingSessionCompletionResponse | null>;
	abandon: () => Promise<void>;
};

const getStorage = (): Storage | null => {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
};

export const getStorageKey = (
	userId: number | string,
	recipeId: number | string,
): string => `${STORAGE_PREFIX}:${userId || "guest"}:${recipeId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isPersistedCookingSession = (
	value: unknown,
	recipeId: number | string,
): value is PersistedCookingSession => {
	if (!isRecord(value)) return false;
	return Number(value.recipe_id) === Number(recipeId)
		&& (typeof value.session_id === "number" || value.session_id === null)
		&& (typeof value.meal_plan_item_id === "number" || value.meal_plan_item_id === null)
		&& typeof value.servings === "number"
		&& typeof value.current_step === "number"
		&& (value.status === "active" || value.status === "paused");
};

export const readStoredSession = (
	key: string | null,
	recipeId: number | string,
): PersistedCookingSession | null => {
	const storage = getStorage();
	if (!storage || !key) return null;

	try {
		const parsed: unknown = JSON.parse(storage.getItem(key) || "null");
		return isPersistedCookingSession(parsed, recipeId) ? parsed : null;
	} catch {
		return null;
	}
};

const writeStoredSession = (
	key: string | null,
	session: PersistedCookingSession | null,
): void => {
	const storage = getStorage();
	if (!storage || !key || !session) return;

	try {
		storage.setItem(key, JSON.stringify({ ...session, saved_at: Date.now() }));
	} catch {
		// Browser storage is an optional fallback; the API remains authoritative.
	}
};

const removeStoredSession = (key: string | null): void => {
	const storage = getStorage();
	if (!storage || !key) return;

	try {
		storage.removeItem(key);
	} catch {
		// Ignore storage cleanup failures.
	}
};

const localSession = (
	recipeId: number | string,
	mealPlanItemId?: number | string | null,
	servings?: number | string | null,
): PersistedCookingSession => ({
	session_id: null,
	recipe_id: Number(recipeId),
	meal_plan_item_id: mealPlanItemId == null ? null : Number(mealPlanItemId),
	servings: servings == null ? 1 : Number(servings),
	current_step: 0,
	status: "active",
});

const asPersistedSession = (session: CookingSession): PersistedCookingSession => ({
	session_id: session.session_id,
	recipe_id: session.recipe_id,
	meal_plan_item_id: session.meal_plan_item_id,
	servings: session.servings,
	current_step: session.current_step,
	status: session.status === "paused" ? "paused" : "active",
});

export const useCookingSession = ({
	enabled = false,
	userId = 0,
	recipeId,
	mealPlanItemId,
	servings,
}: UseCookingSessionOptions = {}): UseCookingSessionResult => {
	const storageKey = recipeId != null ? getStorageKey(userId, recipeId) : null;
	const [session, setSession] = useState<PersistedCookingSession | null>(null);
	const [isReady, setIsReady] = useState(!enabled || recipeId == null);
	const [error, setError] = useState<string | null>(null);
	const sessionRef = useRef<PersistedCookingSession | null>(null);

	useEffect(() => {
		let cancelled = false;
		const stored = storageKey && recipeId != null
			? readStoredSession(storageKey, recipeId)
			: null;

		sessionRef.current = stored;
		setSession(stored);
		setError(null);

		if (!enabled || recipeId == null) {
			setIsReady(true);
			return () => {
				cancelled = true;
			};
		}

		if (!userId) {
			const guestSession = stored || localSession(recipeId, mealPlanItemId, servings);
			sessionRef.current = guestSession;
			setSession(guestSession);
			writeStoredSession(storageKey, guestSession);
			setIsReady(true);
			return () => {
				cancelled = true;
			};
		}

		const fallbackSession = stored || localSession(recipeId, mealPlanItemId, servings);
		sessionRef.current = fallbackSession;
		setSession(fallbackSession);
		writeStoredSession(storageKey, fallbackSession);
		setIsReady(false);
		void startCookingSession({
			recipeId: Number(recipeId),
			...(mealPlanItemId ? { mealPlanItemId: Number(mealPlanItemId) } : {}),
			...(servings ? { servings: Number(servings) } : {}),
		})
			.then(({ session: serverSession }) => {
				if (cancelled) return;
				const nextSession = asPersistedSession(serverSession);
				sessionRef.current = nextSession;
				setSession(nextSession);
				writeStoredSession(storageKey, nextSession);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Progress could not sync. It is saved on this device for now.");
			})
			.finally(() => {
				if (!cancelled) setIsReady(true);
			});

		return () => {
			cancelled = true;
		};
	}, [enabled, mealPlanItemId, recipeId, servings, storageKey, userId]);

	const updateProgress = useCallback((currentStep: number): void => {
		if (recipeId == null) return;
		const current = sessionRef.current;
		const next: PersistedCookingSession = {
			...(current || localSession(recipeId, mealPlanItemId, servings)),
			current_step: currentStep,
			status: "active",
		};
		sessionRef.current = next;
		setSession(next);
		writeStoredSession(storageKey, next);

		if (!userId || current?.session_id == null) return;

		void updateCookingSession(current.session_id, { currentStep })
			.then(({ session: serverSession }) => {
				if (sessionRef.current?.session_id !== current.session_id || sessionRef.current.current_step !== currentStep) return;
				const nextSession = asPersistedSession(serverSession);
				sessionRef.current = nextSession;
				setSession(nextSession);
				writeStoredSession(storageKey, nextSession);
			})
			.catch(() => setError("Progress could not sync. It is saved on this device for now."));
	}, [mealPlanItemId, recipeId, servings, storageKey, userId]);

	const pause = useCallback(async (): Promise<void> => {
		const current = sessionRef.current;
		if (!current) return;

		if (userId && current.session_id != null) {
			try {
				const { session: serverSession } = await updateCookingSession(current.session_id, { status: "paused" });
				const nextSession = asPersistedSession(serverSession);
				sessionRef.current = nextSession;
				setSession(nextSession);
				writeStoredSession(storageKey, nextSession);
				return;
			} catch {
				setError("Progress could not sync. It is saved on this device for now.");
			}
		}

		const paused: PersistedCookingSession = { ...current, status: "paused" };
		sessionRef.current = paused;
		setSession(paused);
		writeStoredSession(storageKey, paused);
	}, [storageKey, userId]);

	const complete = useCallback(async (): Promise<CookingSessionCompletionResponse | null> => {
		const current = sessionRef.current;
		if (userId && current?.session_id != null) {
			const result = await completeCookingSession(current.session_id);
			removeStoredSession(storageKey);
			sessionRef.current = null;
			setSession(null);
			return result;
		}

		removeStoredSession(storageKey);
		sessionRef.current = null;
		setSession(null);
		return null;
	}, [storageKey, userId]);

	const abandon = useCallback(async (): Promise<void> => {
		const current = sessionRef.current;
		if (userId && current?.session_id != null) await abandonCookingSession(current.session_id);
		removeStoredSession(storageKey);
		sessionRef.current = null;
		setSession(null);
	}, [storageKey, userId]);

	return { session, isReady, error, updateProgress, pause, complete, abandon };
};
