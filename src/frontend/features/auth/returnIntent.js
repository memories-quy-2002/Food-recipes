const STORAGE_KEY = "food-recipes:auth-intent";
const ALLOWED_ACTIONS = new Set(["saveRecipe"]);
const INTENT_TTL_MS = 10 * 60 * 1000;

const getStorage = () =>
	typeof window === "undefined" ? null : window.sessionStorage;

export const isSafeInternalPath = (value) => {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
		return false;
	}

	try {
		const url = new URL(value, window.location.origin);
		return url.origin === window.location.origin && url.pathname.startsWith("/");
	} catch {
		return false;
	}
};

export const clearAuthIntent = () => {
	getStorage()?.removeItem(STORAGE_KEY);
};

export const getAuthIntentSnapshot = () => getStorage()?.getItem(STORAGE_KEY) ?? null;

export const clearAuthIntentIfUnchanged = (snapshot) => {
	const storage = getStorage();
	if (storage && snapshot !== null && storage.getItem(STORAGE_KEY) === snapshot) {
		storage.removeItem(STORAGE_KEY);
	}
};

export const beginAuthIntent = ({ returnTo, action, recipeId } = {}) => {
	if (!isSafeInternalPath(returnTo)) {
		clearAuthIntent();
		return null;
	}

	const intent = {
		returnTo,
		createdAt: Date.now(),
		...(ALLOWED_ACTIONS.has(action) ? { action } : {}),
		...(recipeId !== undefined && recipeId !== null
			? { recipeId: String(recipeId) }
			: {}),
	};
	getStorage()?.setItem(STORAGE_KEY, JSON.stringify(intent));
	return intent;
};

export const consumeAuthIntent = () => {
	const storage = getStorage();
	if (!storage) return null;

	const rawIntent = storage.getItem(STORAGE_KEY);
	storage.removeItem(STORAGE_KEY);
	if (!rawIntent) return null;

	try {
		const intent = JSON.parse(rawIntent);
		if (
			typeof intent?.createdAt !== "number" ||
			!Number.isFinite(intent.createdAt) ||
			Date.now() - intent.createdAt > INTENT_TTL_MS ||
			Date.now() - intent.createdAt < 0
		) return null;
		if (!isSafeInternalPath(intent?.returnTo)) return null;
		if (intent.action && !ALLOWED_ACTIONS.has(intent.action)) return null;
		if (intent.action === "saveRecipe" && !intent.recipeId) return null;
		return {
			returnTo: intent.returnTo,
			...(intent.action ? { action: intent.action } : {}),
			...(intent.recipeId ? { recipeId: String(intent.recipeId) } : {}),
		};
	} catch {
		return null;
	}
};

export const isMatchingSaveRecipeIntent = (intent, currentPath, recipeId) =>
	intent?.action === "saveRecipe" &&
	isSafeInternalPath(currentPath) &&
	intent.returnTo === currentPath &&
	String(intent.recipeId) === String(recipeId);

export const getAuthReturnPath = (location) => {
	const statePath = location?.state?.from;
	return isSafeInternalPath(statePath) ? statePath : "/";
};

export { STORAGE_KEY };
