const DRAFT_VERSION = 2;
const SUPPORTED_DRAFT_VERSIONS = new Set([1, DRAFT_VERSION]);
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
	"structuredIngredients",
	"nutrition",
	"dietaryTags",
	"allergenTags",
	"serverRecipeId",
];
const STRING_FIELDS = new Set([
	"recipeName",
	"recipeCategoryName",
	"recipeMealName",
	"recipeDescription",
]);
const ARRAY_FIELDS = new Set(["recipeIngredients", "recipeInstructions"]);
const TIME_FIELDS = new Set(["recipePrepTime", "recipeCookTime"]);
const TAG_FIELDS = new Set(["dietaryTags", "allergenTags"]);
const NUTRITION_FIELDS = new Set([
	"servings",
	"calories",
	"protein",
	"carbohydrates",
	"fat",
	"fiber",
	"sugar",
	"sodium",
]);

export const getRecipeDraftStorageKey = (userId) =>
	`${STORAGE_PREFIX}${String(userId)}`;

export const serializeRecipeDraft = (formRecipe, userId, savedAt = Date.now()) => {
	const form = DRAFT_FIELDS.reduce((result, field) => {
		if (Object.prototype.hasOwnProperty.call(formRecipe, field)) {
			result[field] = formRecipe[field];
		}
		return result;
	}, { recipeImage: null });

	return {
		version: DRAFT_VERSION,
		userId: String(userId),
		savedAt,
		serverRecipeId: formRecipe.serverRecipeId ?? null,
		form,
	};
};

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
		} else if (field === "structuredIngredients") {
			if (value === undefined) {
				form[field] = [];
				continue;
			}
			if (!Array.isArray(value)) return null;
			const ingredients = value.map((ingredient) => {
				if (!isRecord(ingredient) || typeof ingredient.name !== "string") return null;
				const optionalStrings = ["quantityText", "unit", "preparation", "originalText"];
				if (optionalStrings.some((key) => ingredient[key] !== undefined && ingredient[key] !== null && typeof ingredient[key] !== "string")) return null;
				if (ingredient.quantity !== undefined && ingredient.quantity !== null && (typeof ingredient.quantity !== "number" || !Number.isFinite(ingredient.quantity))) return null;
				if (ingredient.position !== undefined && (!Number.isSafeInteger(ingredient.position) || ingredient.position < 0)) return null;
				return {
					...(ingredient.position === undefined ? {} : { position: ingredient.position }),
					quantity: ingredient.quantity ?? null,
					quantityText: ingredient.quantityText ?? "",
					unit: ingredient.unit ?? "",
					name: ingredient.name,
					preparation: ingredient.preparation ?? "",
					...(ingredient.originalText === undefined ? {} : { originalText: ingredient.originalText }),
				};
			});
			if (ingredients.some((ingredient) => ingredient === null)) return null;
			form[field] = ingredients;
		} else if (field === "nutrition") {
			if (value === undefined) {
				form[field] = {};
				continue;
			}
			if (!isRecord(value)) return null;
			const nutrition = {};
			for (const [key, item] of Object.entries(value)) {
				if (!NUTRITION_FIELDS.has(key) || (item !== null && typeof item !== "string" && typeof item !== "number")) return null;
				nutrition[key] = item;
			}
			form[field] = nutrition;
		} else if (TAG_FIELDS.has(field)) {
			if (value === undefined) {
				form[field] = [];
				continue;
			}
			if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
			form[field] = value;
		} else if (field === "serverRecipeId") {
			if (value !== undefined && value !== null && !Number.isSafeInteger(Number(value))) return null;
			form[field] = value === undefined ? null : value;
		}
	}
	return form;
};

export const parseRecipeDraft = (rawValue) => {
	try {
		const value = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		if (!isRecord(value) || !SUPPORTED_DRAFT_VERSIONS.has(value.version) || !value.userId || !Number.isFinite(value.savedAt) || !isRecord(value.form)) {
			return null;
		}

		const form = normalizeDraftForm(value.form);
		if (!form) return null;

		const serverRecipeId = value.serverRecipeId ?? form.serverRecipeId ?? null;
		if (serverRecipeId !== null && !Number.isSafeInteger(Number(serverRecipeId))) return null;
		form.serverRecipeId = serverRecipeId;
		return { version: value.version, userId: String(value.userId), savedAt: value.savedAt, serverRecipeId, form };
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
