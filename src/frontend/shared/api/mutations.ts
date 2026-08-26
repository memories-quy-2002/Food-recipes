import type { CatalogItem, RecipeDraftPayload } from "./contracts";

type CatalogItemLike = Partial<CatalogItem> & {
	category_id?: number | string;
	category_name?: string | null;
	meal_id?: number | string;
	meal_name?: string | null;
};

type RecipeTimeInput = {
	number?: number | string | null;
	unit?: string | null;
};

type MetadataSource = "provided_by_author" | "estimated" | "verified_external";

type RecipeNutritionForm = {
	caloriesPerServing?: number | string | null;
	proteinGrams?: number | string | null;
	carbohydratesGrams?: number | string | null;
	fatGrams?: number | string | null;
	fiberGrams?: number | string | null;
	sugarGrams?: number | string | null;
	sodiumMilligrams?: number | string | null;
	source?: MetadataSource | null;
	sourceReference?: string | null;
};

type RecipeMutationForm = {
	recipeName: string;
	recipeDescription?: string | null;
	recipeCategoryName?: string | null;
	recipeMealName?: string | null;
	recipePrepTime?: RecipeTimeInput | null;
	recipeCookTime?: RecipeTimeInput | null;
	recipeIngredients?: string[];
	recipeInstructions?: string[];
	recipeNutrition?: RecipeNutritionForm | null;
	recipeAllergens?: Array<string | null | undefined>;
};

type RecipeMetadataPayload = {
	nutrition: {
		caloriesPerServing: number;
		proteinGrams?: number;
		carbohydratesGrams?: number;
		fatGrams?: number;
		fiberGrams?: number;
		sugarGrams?: number;
		sodiumMilligrams?: number;
		source: MetadataSource;
		sourceReference?: string;
	} | null;
	allergens: Array<{
		name: string;
		source: "provided_by_author";
	}>;
};

export type SerializedRecipePayload = RecipeDraftPayload & {
	metadata?: RecipeMetadataPayload;
};

const findCatalogId = (
	items: CatalogItemLike[],
	name: string | null | undefined,
	label: string,
): number => {
	const normalizedName = String(name || "").trim().toLowerCase();
	const match = items.find((item) => {
		const itemName = item.name ?? item.category_name ?? item.meal_name;
		return String(itemName || "").trim().toLowerCase() === normalizedName;
	});
	const id = Number(match?.id ?? match?.category_id ?? match?.meal_id);

	if (!Number.isInteger(id) || id < 1) {
		throw new Error(`Nest recipe creation requires a known ${label} ID.`);
	}

	return id;
};

const toMinutes = (time: RecipeTimeInput | null | undefined): number => {
	const unitsInMinutes: Record<string, number> = {
		days: 24 * 60,
		hours: 60,
		minutes: 1,
		seconds: 1 / 60,
	};
	const value = Number(time?.number);
	const multiplier = time?.unit ? unitsInMinutes[time.unit] : undefined;

	if (!Number.isFinite(value) || !multiplier) {
		throw new Error("Nest recipe creation requires valid cooking times.");
	}

	return Math.max(1, Math.ceil(value * multiplier));
};

const findOptionalCatalogId = (
	items: CatalogItemLike[],
	name: string | null | undefined,
): number | undefined => {
	const normalizedName = String(name || "").trim().toLowerCase();
	const match = items.find((item) => {
		const itemName = item.name ?? item.category_name ?? item.meal_name;
		return String(itemName || "").trim().toLowerCase() === normalizedName;
	});
	const id = Number(match?.id ?? match?.category_id ?? match?.meal_id);
	return Number.isInteger(id) && id > 0 ? id : undefined;
};

const toOptionalMinutes = (
	time: RecipeTimeInput | null | undefined,
): number | undefined => {
	try {
		return toMinutes(time);
	} catch {
		return undefined;
	}
};

export const serializeWishlistPayload = (
	recipeId: number | string,
): { recipeId: number | string } => ({ recipeId });

const toOptionalNumber = (
	value: number | string | null | undefined,
): number | undefined => {
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? number : undefined;
};

const normalizeMetadataSource = (
	source: MetadataSource | null | undefined,
): MetadataSource => source || "provided_by_author";

export const serializeRecipeMetadata = (
	recipe: RecipeMutationForm,
): RecipeMetadataPayload | undefined => {
	const nutrition = recipe.recipeNutrition;
	const caloriesPerServing = toOptionalNumber(nutrition?.caloriesPerServing);
	const allergens = [...new Set(recipe.recipeAllergens || [])]
		.filter((name): name is string => Boolean(name))
		.map((name) => ({
			name,
			source: "provided_by_author" as const,
		}));

	if (caloriesPerServing === undefined && allergens.length === 0) return undefined;

	return {
		nutrition:
			caloriesPerServing === undefined
				? null
				: {
						caloriesPerServing,
						proteinGrams: toOptionalNumber(nutrition?.proteinGrams),
						carbohydratesGrams: toOptionalNumber(
							nutrition?.carbohydratesGrams,
						),
						fatGrams: toOptionalNumber(nutrition?.fatGrams),
						fiberGrams: toOptionalNumber(nutrition?.fiberGrams),
						sugarGrams: toOptionalNumber(nutrition?.sugarGrams),
						sodiumMilligrams: toOptionalNumber(nutrition?.sodiumMilligrams),
						source: normalizeMetadataSource(nutrition?.source),
						sourceReference: nutrition?.sourceReference?.trim() || undefined,
					},
		allergens,
	};
};

export const serializeCreateRecipePayload = ({
	recipe,
	categories,
	meals,
	imageUrl,
}: {
	recipe: RecipeMutationForm;
	categories: CatalogItemLike[];
	meals: CatalogItemLike[];
	imageUrl?: string | null;
}): SerializedRecipePayload => {
	const metadata = serializeRecipeMetadata(recipe);
	return {
		name: recipe.recipeName.trim(),
		description: recipe.recipeDescription ?? undefined,
		mealId: findCatalogId(meals, recipe.recipeMealName, "meal"),
		categoryId: findCatalogId(categories, recipe.recipeCategoryName, "category"),
		prepTimeMinutes: toMinutes(recipe.recipePrepTime),
		cookTimeMinutes: toMinutes(recipe.recipeCookTime),
		ingredients: recipe.recipeIngredients,
		instructions: recipe.recipeInstructions,
		imageUrl,
		...(metadata ? { metadata } : {}),
	};
};

export const serializeCreateRecipeDraftPayload = ({
	recipe,
	categories,
	meals,
	imageUrl,
}: {
	recipe: RecipeMutationForm;
	categories: CatalogItemLike[];
	meals: CatalogItemLike[];
	imageUrl?: string | null;
}): Record<string, unknown> => {
	const payload: Record<string, unknown> = {
		name: recipe.recipeName?.trim() || undefined,
		description: recipe.recipeDescription?.trim() || undefined,
		mealId: findOptionalCatalogId(meals, recipe.recipeMealName),
		categoryId: findOptionalCatalogId(categories, recipe.recipeCategoryName),
		prepTimeMinutes: toOptionalMinutes(recipe.recipePrepTime),
		cookTimeMinutes: toOptionalMinutes(recipe.recipeCookTime),
		ingredients: (recipe.recipeIngredients || [])
			.map((value) => value.trim())
			.filter(Boolean),
		instructions: (recipe.recipeInstructions || [])
			.map((value) => value.trim())
			.filter(Boolean),
	};
	if (imageUrl) payload.imageUrl = imageUrl;
	return Object.fromEntries(
		Object.entries(payload).filter(([, value]) => value !== undefined),
	);
};

export const serializeProfilePayload = <T>(profile: T): T => profile;

export const getUpdatedProfileUser = <T>(responseData: T): T => responseData;

export const isWishlistAddSuccess = (status: number): boolean => status === 201;

export const isRecipeCreateSuccess = (status: number): boolean => status === 201;

export const isRecipeDeleteSuccess = (status: number): boolean => status === 204;
