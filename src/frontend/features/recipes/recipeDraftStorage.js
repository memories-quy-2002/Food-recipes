const DRAFT_VERSION = 1;
const STORAGE_PREFIX = "food-recipes:recipe-draft:user:";

const DRAFT_FIELDS = [
	"recipeName",
	"recipeCategoryName",
	"recipeMealName",
	"recipeDescription",
	"recipeIngredients",
	"recipeInstructions",
	"recipePrepTime",
	"recipeCookTime",
];
const STRING_FIELDS = new Set([
	"recipeName",
	"recipeCategoryName",
	"recipeMealName",
	"recipeDescription",
]);
const ARRAY_FIELDS = new Set(["recipeIngredients", "recipeInstructions"]);
const TIME_FIELDS = new Set(["recipePrepTime", "recipeCookTime"]);

export const getRecipeDraftStorageKey = (userId) =>
	`${STORAGE_PREFIX}${String(userId)}`;

export const serializeRecipeDraft = (formRecipe, userId, savedAt = Date.now()) => ({
	version: DRAFT_VERSION,
	userId: String(userId),
	savedAt,
	form: DRAFT_FIELDS.reduce(
		(result, field) => ({ ...result, [field]: formRecipe[field] }),
		{ recipeImage: null }
	),
});

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeDraftForm = (storedForm) => {
	if (!isRecord(storedForm)) return null;

	const form = { recipeImage: null };
	for (const field of DRAFT_FIELDS) {
		const value = storedForm[field];
		if (STRING_FIELDS.has(field)) {
			if (value !== undefined && typeof value !== "string") return null;
			form[field] = value ?? "";
		} else if (ARRAY_FIELDS.has(field)) {
			if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
			form[field] = value;
		} else if (TIME_FIELDS.has(field)) {
			if (!isRecord(value) || (typeof value.number !== "string" && typeof value.number !== "number") || typeof value.unit !== "string") return null;
			form[field] = { number: value.number, unit: value.unit };
		}
	}
	return form;
};

export const parseRecipeDraft = (rawValue) => {
	try {
		const value = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		if (!isRecord(value) || value.version !== DRAFT_VERSION || !value.userId || !Number.isFinite(value.savedAt) || !isRecord(value.form)) {
			return null;
		}

		const form = normalizeDraftForm(value.form);
		if (!form) return null;

		return { version: DRAFT_VERSION, userId: String(value.userId), savedAt: value.savedAt, form };
	} catch {
		return null;
	}
};

export const loadRecipeDraft = (storage, userId) => {
	const key = getRecipeDraftStorageKey(userId);
	try {
		const draft = parseRecipeDraft(storage.getItem(key));
		if (!draft || draft.userId !== String(userId)) {
			storage.removeItem(key);
			return null;
		}
		return draft;
	} catch {
		try {
			storage.removeItem(key);
		} catch {
			// Storage can be unavailable in privacy-restricted browsers.
		}
		return null;
	}
};

export const saveRecipeDraft = (storage, userId, formRecipe, savedAt = Date.now()) => {
	try {
		storage.setItem(
			getRecipeDraftStorageKey(userId),
			JSON.stringify(serializeRecipeDraft(formRecipe, userId, savedAt))
		);
		return true;
	} catch {
		return false;
	}
};

export const clearRecipeDraft = (storage, userId) => {
	try {
		storage.removeItem(getRecipeDraftStorageKey(userId));
	} catch {
		// Clearing is best effort when storage is unavailable.
	}
};
