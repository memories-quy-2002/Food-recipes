import type { RecipeFormValues } from "./recipeForm.schema";

const DRAFT_VERSION = 2 as const;
type DraftVersion = 1 | typeof DRAFT_VERSION;
type DraftTime = { number: string | number; unit: RecipeFormValues["recipePrepTime"]["unit"] };
type StringDraftField = "recipeName" | "recipeCategoryName" | "recipeMealName" | "recipeDescription";
type ArrayDraftField = "recipeIngredients" | "recipeInstructions";
type TimeDraftField = "recipePrepTime" | "recipeCookTime";
type TagDraftField = "dietaryTags" | "allergenTags";
type StoredStructuredIngredient = {
	position?: number;
	quantity?: number | null;
	quantityText?: string;
	unit?: string;
	name: string;
	preparation?: string;
	originalText?: string | null;
};
type NutritionField =
	| "servings"
	| "calories"
	| "protein"
	| "carbohydrates"
	| "fat"
	| "fiber"
	| "sugar"
	| "sodium";
type StoredNutrition = Partial<Record<NutritionField, string | number | null>>;
export type StoredRecipeDraftForm = {
	recipeImage: null;
	recipeName?: string;
	recipeCategoryName?: string;
	recipeMealName?: string;
	recipeDescription?: string;
	recipeIngredients?: string[];
	recipeInstructions?: string[];
	recipePrepTime?: DraftTime;
	recipeCookTime?: DraftTime;
	structuredIngredients?: StoredStructuredIngredient[];
	nutrition?: StoredNutrition;
	dietaryTags?: string[];
	allergenTags?: string[];
	serverRecipeId?: number | string | null;
};
type DraftField = Exclude<keyof StoredRecipeDraftForm, "recipeImage">;
export type StoredRecipeDraft = {
	version: DraftVersion;
	userId: string;
	savedAt: number;
	serverRecipeId: number | string | null;
	form: StoredRecipeDraftForm;
};

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
] as const satisfies readonly DraftField[];
const isStringField = (field: DraftField): field is StringDraftField =>
	field === "recipeName" || field === "recipeCategoryName" || field === "recipeMealName" || field === "recipeDescription";
const isArrayField = (field: DraftField): field is ArrayDraftField =>
	field === "recipeIngredients" || field === "recipeInstructions";
const isTimeField = (field: DraftField): field is TimeDraftField =>
	field === "recipePrepTime" || field === "recipeCookTime";
const isTagField = (field: DraftField): field is TagDraftField =>
	field === "dietaryTags" || field === "allergenTags";
const isNutritionField = (field: string): field is NutritionField =>
	field === "servings" || field === "calories" || field === "protein" || field === "carbohydrates" ||
	field === "fat" || field === "fiber" || field === "sugar" || field === "sodium";
const isDurationUnit = (value: unknown): value is DraftTime["unit"] =>
	value === "seconds" || value === "minutes" || value === "hours" || value === "days";
const isDraftVersion = (value: unknown): value is DraftVersion => value === 1 || value === DRAFT_VERSION;

export const getRecipeDraftStorageKey = (userId: number | string) =>
	`${STORAGE_PREFIX}${String(userId)}`;

export const serializeRecipeDraft = (
	formRecipe: Partial<RecipeFormValues>,
	userId: number | string,
	savedAt = Date.now(),
): StoredRecipeDraft => {
	const form: StoredRecipeDraftForm = {
		recipeImage: null,
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeName") ? { recipeName: formRecipe.recipeName } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeCategoryName") ? { recipeCategoryName: formRecipe.recipeCategoryName } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeMealName") ? { recipeMealName: formRecipe.recipeMealName } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeDescription") ? { recipeDescription: formRecipe.recipeDescription } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeIngredients") ? { recipeIngredients: formRecipe.recipeIngredients } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeInstructions") ? { recipeInstructions: formRecipe.recipeInstructions } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipePrepTime") ? { recipePrepTime: formRecipe.recipePrepTime } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "recipeCookTime") ? { recipeCookTime: formRecipe.recipeCookTime } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "structuredIngredients") ? { structuredIngredients: formRecipe.structuredIngredients } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "nutrition") ? { nutrition: formRecipe.nutrition } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "dietaryTags") ? { dietaryTags: formRecipe.dietaryTags } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "allergenTags") ? { allergenTags: formRecipe.allergenTags } : {}),
		...(Object.prototype.hasOwnProperty.call(formRecipe, "serverRecipeId") ? { serverRecipeId: formRecipe.serverRecipeId } : {}),
	};

	return {
		version: DRAFT_VERSION,
		userId: String(userId),
		savedAt,
		serverRecipeId: formRecipe.serverRecipeId ?? null,
		form,
	};
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeDraftForm = (storedForm: unknown): StoredRecipeDraftForm | null => {
	if (!isRecord(storedForm)) return null;

	const form: StoredRecipeDraftForm = { recipeImage: null };
	for (const field of DRAFT_FIELDS) {
		const value = storedForm[field];
		if (isStringField(field)) {
			if (value !== undefined && typeof value !== "string") return null;
			form[field] = value ?? "";
		} else if (isArrayField(field)) {
			if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
			form[field] = value;
		} else if (isTimeField(field)) {
			if (!isRecord(value) || (typeof value.number !== "string" && typeof value.number !== "number") || !isDurationUnit(value.unit)) return null;
			form[field] = { number: value.number, unit: value.unit };
		} else if (field === "structuredIngredients") {
			if (value === undefined) {
				form[field] = [];
				continue;
			}
			if (!Array.isArray(value)) return null;
			const ingredients: StoredStructuredIngredient[] = [];
			for (const ingredient of value) {
				if (!isRecord(ingredient) || typeof ingredient.name !== "string") return null;
				const optionalStrings = ["quantityText", "unit", "preparation", "originalText"];
				if (optionalStrings.some((key) => ingredient[key] !== undefined && ingredient[key] !== null && typeof ingredient[key] !== "string")) return null;
				if (ingredient.quantity !== undefined && ingredient.quantity !== null && (typeof ingredient.quantity !== "number" || !Number.isFinite(ingredient.quantity))) return null;
				if (ingredient.position !== undefined && (typeof ingredient.position !== "number" || !Number.isSafeInteger(ingredient.position) || ingredient.position < 0)) return null;
				const quantityText = typeof ingredient.quantityText === "string" ? ingredient.quantityText : "";
				const unit = typeof ingredient.unit === "string" ? ingredient.unit : "";
				const preparation = typeof ingredient.preparation === "string" ? ingredient.preparation : "";
				const originalText = ingredient.originalText === undefined || ingredient.originalText === null ? undefined : String(ingredient.originalText);
				ingredients.push({
					...(ingredient.position === undefined ? {} : { position: ingredient.position }),
					quantity: typeof ingredient.quantity === "number" ? ingredient.quantity : null,
					quantityText,
					unit,
					name: ingredient.name,
					preparation,
					...(originalText === undefined ? {} : { originalText }),
				});
			}
			form[field] = ingredients;
		} else if (field === "nutrition") {
			if (value === undefined) {
				form[field] = {};
				continue;
			}
			if (!isRecord(value)) return null;
			const nutrition: StoredNutrition = {};
			for (const [key, item] of Object.entries(value)) {
				if (!isNutritionField(key) || (item !== null && typeof item !== "string" && typeof item !== "number")) return null;
				nutrition[key] = item;
			}
			form[field] = nutrition;
		} else if (isTagField(field)) {
			if (value === undefined) {
				form[field] = [];
				continue;
			}
			if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
			form[field] = value;
		} else if (field === "serverRecipeId") {
			if (value !== undefined && value !== null && !Number.isSafeInteger(Number(value))) return null;
			if (value !== undefined && value !== null && typeof value !== "number" && typeof value !== "string") return null;
			form[field] = value === undefined ? null : value;
		}
	}
	return form;
};

export const parseRecipeDraft = (rawValue: unknown): StoredRecipeDraft | null => {
	try {
		const value = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		if (!isRecord(value) || !isDraftVersion(value.version) || typeof value.userId !== "string" || !value.userId || typeof value.savedAt !== "number" || !Number.isFinite(value.savedAt) || !isRecord(value.form)) return null;

		const form = normalizeDraftForm(value.form);
		if (!form) return null;

		const serverRecipeId = value.serverRecipeId ?? form.serverRecipeId ?? null;
		if (serverRecipeId !== null && (typeof serverRecipeId !== "number" && typeof serverRecipeId !== "string" || !Number.isSafeInteger(Number(serverRecipeId)))) return null;
		form.serverRecipeId = serverRecipeId;
		return { version: value.version, userId: value.userId, savedAt: value.savedAt, serverRecipeId, form };
	} catch {
		return null;
	}
};

export const loadRecipeDraft = (storage: Storage, userId: number | string): StoredRecipeDraft | null => {
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

export const saveRecipeDraft = (
	storage: Storage,
	userId: number | string,
	formRecipe: Partial<RecipeFormValues>,
	savedAt = Date.now(),
): boolean => {
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

export const clearRecipeDraft = (storage: Storage, userId: number | string): void => {
	try {
		storage.removeItem(getRecipeDraftStorageKey(userId));
	} catch {
		// Clearing is best effort when storage is unavailable.
	}
};
