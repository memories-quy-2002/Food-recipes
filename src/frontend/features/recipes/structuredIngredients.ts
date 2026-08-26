import type { StructuredIngredient } from "@/shared/api/contracts";

export const INGREDIENT_UNITS = [
	"GRAM",
	"KILOGRAM",
	"MILLILITER",
	"LITER",
	"TEASPOON",
	"TABLESPOON",
	"CUP",
	"PIECE",
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export type RecipeIngredient = {
	ingredientId?: number;
	name: string;
	quantity?: number;
	unit?: IngredientUnit;
	note?: string;
};

export type ReadableStructuredIngredient = StructuredIngredient & {
	note?: string | null;
};

const unitLabels: Record<IngredientUnit, string> = {
	GRAM: "g",
	KILOGRAM: "kg",
	MILLILITER: "ml",
	LITER: "l",
	TEASPOON: "tsp",
	TABLESPOON: "tbsp",
	CUP: "cup",
	PIECE: "piece",
};

const unitGroups: Record<IngredientUnit, string> = {
	GRAM: "mass",
	KILOGRAM: "mass",
	MILLILITER: "volume",
	LITER: "volume",
	TEASPOON: "volume",
	TABLESPOON: "volume",
	CUP: "volume",
	PIECE: "count",
};

const unitFactors: Record<IngredientUnit, number> = {
	GRAM: 1,
	KILOGRAM: 1000,
	MILLILITER: 1,
	LITER: 1000,
	TEASPOON: 1,
	TABLESPOON: 3,
	CUP: 48,
	PIECE: 1,
};

const isIngredientUnit = (value: unknown): value is IngredientUnit =>
	typeof value === "string" && INGREDIENT_UNITS.includes(value as IngredientUnit);

export const normalizeIngredientUnit = (value: unknown): IngredientUnit | undefined => {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim().toUpperCase();
	return isIngredientUnit(normalized) ? normalized : undefined;
};

const normalizeIngredient = (ingredient: RecipeIngredient): RecipeIngredient => ({
	...ingredient,
	name: ingredient.name.trim(),
	quantity:
		typeof ingredient.quantity === "number" && Number.isFinite(ingredient.quantity)
			? ingredient.quantity
			: undefined,
	unit: normalizeIngredientUnit(ingredient.unit),
	note: ingredient.note?.trim() || undefined,
});

const formatNumber = (value: number) =>
	Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const isReadableStructuredIngredient = (input: unknown): input is ReadableStructuredIngredient =>
	typeof input === "object" && input !== null && "name" in input && typeof input.name === "string";

export const formatStructuredIngredient = (input: unknown): string => {
	if (!isReadableStructuredIngredient(input)) return String(JSON.stringify(input));

	const ingredient = input;
	const quantityText = [ingredient.quantityText, ingredient.quantity_text]
		.find((value) => typeof value === "string" && value.trim())?.trim()
		|| (typeof ingredient.quantity === "number" && Number.isFinite(ingredient.quantity) ? formatNumber(ingredient.quantity) : "");
	const unitValue = [ingredient.unit, ingredient.unit_text]
		.find((value) => typeof value === "string" && value.trim())?.trim() || "";
	const normalizedUnit = normalizeIngredientUnit(unitValue);
	const unit = normalizedUnit ? unitLabels[normalizedUnit] : unitValue;
	const preparation = [ingredient.preparation, ingredient.preparation_text]
		.find((value) => typeof value === "string" && value.trim())?.trim() || "";
	const note = typeof ingredient.note === "string" ? ingredient.note.trim() : "";
	const text = [quantityText, unit, ingredient.name.trim()]
		.filter((value) => value.length > 0)
		.join(" ");
	return `${text}${preparation ? ` (${preparation})` : ""}${note ? `, ${note}` : ""}`.trim();
};

export const scaleStructuredIngredient = (
	input: RecipeIngredient,
	servings: number,
	baseServings: number,
): RecipeIngredient => {
	const ingredient = normalizeIngredient(input);
	if (
		ingredient.quantity === undefined ||
		!Number.isFinite(servings) ||
		!Number.isFinite(baseServings) ||
		baseServings <= 0
	) {
		return input;
	}
	return {
		...ingredient,
		quantity: Number((ingredient.quantity * (servings / baseServings)).toFixed(2)),
	};
};

const toBaseQuantity = (ingredient: RecipeIngredient) =>
	ingredient.quantity === undefined || !ingredient.unit
		? null
		: ingredient.quantity * unitFactors[ingredient.unit];

export const consolidateStructuredIngredients = (
	inputs: RecipeIngredient[],
): RecipeIngredient[] => {
	const result: RecipeIngredient[] = [];
	for (const rawInput of inputs) {
		const input = normalizeIngredient(rawInput);
		const baseQuantity = toBaseQuantity(input);
		const group = input.unit ? unitGroups[input.unit] : null;
		const existingIndex = result.findIndex((candidate) => {
			if (
				candidate.name.toLowerCase() !== input.name.toLowerCase() ||
				(candidate.note || "").toLowerCase() !== (input.note || "").toLowerCase()
			) return false;
			if (baseQuantity === null || !candidate.unit || toBaseQuantity(candidate) === null) return false;
			return unitGroups[candidate.unit] === group;
		});

		if (existingIndex === -1) {
			result.push(input);
			continue;
		}

		const existing = result[existingIndex];
		const existingBase = toBaseQuantity(existing) as number;
		result[existingIndex] = {
			...existing,
			quantity: Number(((existingBase + (baseQuantity as number)) / unitFactors[existing.unit!]).toFixed(2)),
		};
	}
	return result;
};
