import axios from "@/shared/api/axios";
import type {
	RecipeDetail,
	RecipeNutritionPayload,
	RecipeTagsPayload,
	StructuredIngredientsPayload,
} from "@/shared/api/contracts";
import { apiRoutes } from "@/shared/api/routes";

export type UpdateRecipePayload = {
	name?: string;
	description?: string;
	mealId?: number;
	categoryId?: number;
	prepTimeMinutes?: number;
	cookTimeMinutes?: number;
	ingredients?: string[];
	instructions?: string[];
	imageUrl?: string | null;
};

export type RecipeEditPayload = {
	base: UpdateRecipePayload;
	ingredients?: StructuredIngredientsPayload;
	nutrition?: RecipeNutritionPayload;
	tags?: RecipeTagsPayload;
};

export type RecipeEditSection = "base" | "ingredients" | "nutrition" | "tags" | "refresh";

type ApiErrorResponse = {
	code?: string;
	message?: string;
	[key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getResponseData = (error: unknown): ApiErrorResponse | undefined => {
	if (!isRecord(error) || !isRecord(error.response) || !isRecord(error.response.data)) return undefined;
	return error.response.data as ApiErrorResponse;
};

const normalizeStructuredIngredient = (ingredient: Record<string, unknown>) => ({
	...ingredient,
	quantityText: ingredient.quantityText ?? ingredient.quantity_text ?? null,
	originalText: ingredient.originalText ?? ingredient.original_text ?? null,
	unit: ingredient.unit ?? ingredient.unit_text ?? null,
});

export const normalizeRecipeEditorValue = <T extends Record<string, unknown>>(recipe: T): T => {
	const structuredIngredients = recipe.structuredIngredients ?? recipe.structured_ingredients;
	if (!Array.isArray(structuredIngredients)) return recipe;

	return {
		...recipe,
		structuredIngredients: structuredIngredients.map((ingredient) =>
			isRecord(ingredient) ? normalizeStructuredIngredient(ingredient) : ingredient
		),
	} as T;
};

export class RecipeEditSaveError extends Error {
	section: RecipeEditSection;
	code?: string;
	status?: number;
	details?: ApiErrorResponse;
	originalError: unknown;

	constructor(section: RecipeEditSection, error: unknown) {
		const responseData = getResponseData(error);
		super(responseData?.message || (error instanceof Error ? error.message : "Unable to save this recipe."));
		this.name = "RecipeEditSaveError";
		this.section = section;
		this.code = responseData?.code;
		this.status = isRecord(error) && isRecord(error.response) && typeof error.response.status === "number"
			? error.response.status
			: undefined;
		this.details = responseData;
		this.originalError = error;
	}
}

export async function getRecipeDetail(recipeId: number): Promise<RecipeDetail> {
	const response = await axios.get(apiRoutes.recipe(recipeId));
	return response.data?.recipe ?? response.data;
}

export async function saveRecipeEdits(recipeId: number, payload: RecipeEditPayload): Promise<RecipeDetail> {
	let savedRecipe: unknown;

	try {
		const response = await axios.patch(apiRoutes.recipe(recipeId), payload.base);
		savedRecipe = response.data?.recipe ?? response.data;
	} catch (error) {
		throw new RecipeEditSaveError("base", error);
	}

	if (payload.ingredients !== undefined) {
		try {
			const response = await axios.put(apiRoutes.recipeIngredients(recipeId), payload.ingredients);
			savedRecipe = response.data?.recipe ?? response.data;
		} catch (error) {
			throw new RecipeEditSaveError("ingredients", error);
		}
	}

	if (payload.nutrition !== undefined) {
		try {
			const response = await axios.put(apiRoutes.recipeNutrition(recipeId), payload.nutrition);
			savedRecipe = response.data?.recipe ?? response.data;
		} catch (error) {
			throw new RecipeEditSaveError("nutrition", error);
		}
	}

	if (payload.tags !== undefined) {
		try {
			const response = await axios.put(apiRoutes.recipeDietaryTags(recipeId), payload.tags);
			savedRecipe = response.data?.recipe ?? response.data;
		} catch (error) {
			throw new RecipeEditSaveError("tags", error);
		}
	}

	if (!isRecord(savedRecipe)) {
		throw new RecipeEditSaveError("refresh", new Error("The server did not return the saved recipe."));
	}

	return normalizeRecipeEditorValue(savedRecipe) as RecipeDetail;
}
