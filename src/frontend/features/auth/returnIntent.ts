const STORAGE_KEY = "food-recipes:auth-intent";
const INTENT_TTL_MS = 10 * 60 * 1000;

export type AuthIntentAction = "saveRecipe" | "saveToCollection";

const ALLOWED_ACTIONS = new Set<AuthIntentAction>([
	"saveRecipe",
	"saveToCollection",
]);

export type AuthIntent = {
	returnTo: string;
	action?: AuthIntentAction;
	recipeId?: string;
};

type StoredAuthIntent = AuthIntent & {
	createdAt: number;
};

export type BeginAuthIntentOptions = {
	returnTo?: unknown;
	action?: AuthIntentAction;
	recipeId?: string | number | null;
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
	typeof value === "object" && value !== null;

const isAuthIntentAction = (value: unknown): value is AuthIntentAction =>
	value === "saveRecipe" || value === "saveToCollection";

const isRecipeIdValue = (value: unknown): value is string | number =>
	(typeof value === "string" && value.length > 0) ||
	(typeof value === "number" && Number.isFinite(value));

const isStoredRecipeId = (value: unknown): value is string =>
	typeof value === "string" && value.length > 0;

const getStorage = (): Storage | null =>
	typeof window === "undefined" ? null : window.sessionStorage;

export const isSafeInternalPath = (value: unknown): value is string => {
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		value.startsWith("//")
	) {
		return false;
	}

	try {
		const url = new URL(value, window.location.origin);
		return url.origin === window.location.origin && url.pathname.startsWith("/");
	} catch {
		return false;
	}
};

const isAuthIntent = (value: unknown): value is AuthIntent => {
	if (!isRecord(value) || !isSafeInternalPath(value.returnTo)) return false;
	if (value.action !== undefined && !isAuthIntentAction(value.action)) {
		return false;
	}
	if (value.recipeId !== undefined && !isStoredRecipeId(value.recipeId)) {
		return false;
	}
	return !(
		value.action &&
		["saveRecipe", "saveToCollection"].includes(value.action) &&
		!value.recipeId
	);
};

export const clearAuthIntent = (): void => {
	getStorage()?.removeItem(STORAGE_KEY);
};

export const getAuthIntentSnapshot = (): string | null =>
	getStorage()?.getItem(STORAGE_KEY) ?? null;

export const clearAuthIntentIfUnchanged = (snapshot: string | null): void => {
	const storage = getStorage();
	if (storage && snapshot !== null && storage.getItem(STORAGE_KEY) === snapshot) {
		storage.removeItem(STORAGE_KEY);
	}
};

export const beginAuthIntent = (
	options: BeginAuthIntentOptions = {},
): StoredAuthIntent | null => {
	const { returnTo, action, recipeId } = options;
	if (!isSafeInternalPath(returnTo)) {
		clearAuthIntent();
		return null;
	}

	const intent: StoredAuthIntent = {
		returnTo,
		createdAt: Date.now(),
	};
	if (action && ALLOWED_ACTIONS.has(action)) intent.action = action;
	if (recipeId !== undefined && recipeId !== null) {
		intent.recipeId = String(recipeId);
	}
	getStorage()?.setItem(STORAGE_KEY, JSON.stringify(intent));
	return intent;
};

export const consumeAuthIntent = (): AuthIntent | null => {
	const storage = getStorage();
	if (!storage) return null;

	const rawIntent = storage.getItem(STORAGE_KEY);
	storage.removeItem(STORAGE_KEY);
	if (!rawIntent) return null;

	try {
		const parsedIntent: unknown = JSON.parse(rawIntent);
		if (!isRecord(parsedIntent)) return null;
		const createdAt = parsedIntent.createdAt;
		if (
			typeof createdAt !== "number" ||
			!Number.isFinite(createdAt) ||
			Date.now() - createdAt > INTENT_TTL_MS ||
			Date.now() - createdAt < 0
		) {
			return null;
		}
		if (!isAuthIntent(parsedIntent)) return null;

		return {
			returnTo: parsedIntent.returnTo,
			...(parsedIntent.action ? { action: parsedIntent.action } : {}),
			...(parsedIntent.recipeId
				? { recipeId: String(parsedIntent.recipeId) }
				: {}),
		};
	} catch {
		return null;
	}
};

export const isMatchingSaveRecipeIntent = (
	intent: unknown,
	currentPath: unknown,
	recipeId: string | number,
): boolean =>
	isAuthIntent(intent) &&
	intent.action === "saveRecipe" &&
	isSafeInternalPath(currentPath) &&
	intent.returnTo === currentPath &&
	String(intent.recipeId) === String(recipeId);

export const isMatchingSaveToCollectionIntent = (
	intent: unknown,
	currentPath: unknown,
	recipeId: string | number,
): boolean =>
	isAuthIntent(intent) &&
	intent.action === "saveToCollection" &&
	isSafeInternalPath(currentPath) &&
	intent.returnTo === currentPath &&
	String(intent.recipeId) === String(recipeId);

export const getAuthReturnPath = (location: {
	state?: unknown;
} | null | undefined): string => {
	const state = location?.state;
	const statePath = isRecord(state) ? state.from : undefined;
	return isSafeInternalPath(statePath) ? statePath : "/";
};

export { STORAGE_KEY };
