import { useCallback, useEffect, useRef, useState } from "react";
import {
	abandonCookingSession,
	completeCookingSession,
	startCookingSession,
	updateCookingSession,
} from "@/features/history/api/cookingSessionApi";

const STORAGE_PREFIX = "food-recipes:cooking-session";

const getStorage = () => {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
};

const getStorageKey = (userId, recipeId) =>
	`${STORAGE_PREFIX}:${userId || "guest"}:${recipeId}`;

const readStoredSession = (key, recipeId) => {
	const storage = getStorage();
	if (!storage) return null;

	try {
		const parsed = JSON.parse(storage.getItem(key) || "null");
		return parsed && Number(parsed.recipe_id) === Number(recipeId)
			? parsed
			: null;
	} catch {
		return null;
	}
};

const writeStoredSession = (key, session) => {
	const storage = getStorage();
	if (!storage || !session) return;

	try {
		storage.setItem(key, JSON.stringify({ ...session, saved_at: Date.now() }));
	} catch {
		// Browser storage is an optional fallback; the API remains authoritative.
	}
};

const removeStoredSession = (key) => {
	const storage = getStorage();
	if (!storage) return;

	try {
		storage.removeItem(key);
	} catch {
		// Ignore storage cleanup failures.
	}
};

const localSession = (recipeId, mealPlanItemId, servings) => ({
	session_id: null,
	recipe_id: recipeId,
	meal_plan_item_id: mealPlanItemId ?? null,
	servings: servings ?? 1,
	current_step: 0,
	status: "active",
});

export const useCookingSession = ({
	enabled = false,
	userId = 0,
	recipeId,
	mealPlanItemId,
	servings,
}) => {
	const storageKey = recipeId ? getStorageKey(userId, recipeId) : null;
	const [session, setSession] = useState(null);
	const [isReady, setIsReady] = useState(!enabled || !recipeId);
	const [error, setError] = useState(null);
	const sessionRef = useRef(null);

	useEffect(() => {
		let cancelled = false;
		const stored = storageKey && recipeId
			? readStoredSession(storageKey, recipeId)
			: null;

		sessionRef.current = stored;
		setSession(stored);
		setError(null);

		if (!enabled || !recipeId) {
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
				sessionRef.current = serverSession;
				setSession(serverSession);
				writeStoredSession(storageKey, serverSession);
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

	const updateProgress = useCallback((currentStep) => {
		const current = sessionRef.current;
		const next = {
			...(current || localSession(recipeId, mealPlanItemId, servings)),
			current_step: currentStep,
			status: "active",
		};
		sessionRef.current = next;
		setSession(next);
		writeStoredSession(storageKey, next);

		if (!userId || !current?.session_id) return;

		void updateCookingSession(current.session_id, { currentStep })
			.then(({ session: serverSession }) => {
				if (sessionRef.current?.session_id !== current.session_id || sessionRef.current.current_step !== currentStep) return;
				sessionRef.current = serverSession;
				setSession(serverSession);
				writeStoredSession(storageKey, serverSession);
			})
			.catch(() => setError("Progress could not sync. It is saved on this device for now."));
	}, [mealPlanItemId, recipeId, servings, storageKey, userId]);

	const pause = useCallback(async () => {
		const current = sessionRef.current;
		if (!current) return;

		if (userId && current.session_id) {
			try {
				const { session: serverSession } = await updateCookingSession(current.session_id, { status: "paused" });
				sessionRef.current = serverSession;
				setSession(serverSession);
				writeStoredSession(storageKey, serverSession);
				return;
			} catch {
				setError("Progress could not sync. It is saved on this device for now.");
			}
		}

		const paused = { ...current, status: "paused" };
		sessionRef.current = paused;
		setSession(paused);
		writeStoredSession(storageKey, paused);
	}, [storageKey, userId]);

	const complete = useCallback(async () => {
		const current = sessionRef.current;
		if (userId && current?.session_id) {
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

	const abandon = useCallback(async () => {
		const current = sessionRef.current;
		if (userId && current?.session_id) await abandonCookingSession(current.session_id);
		removeStoredSession(storageKey);
		sessionRef.current = null;
		setSession(null);
	}, [storageKey, userId]);

	return { session, isReady, error, updateProgress, pause, complete, abandon };
};

export { getStorageKey, readStoredSession };
