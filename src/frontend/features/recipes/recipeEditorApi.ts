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

export class RecipeEditSaveError extends Error {
	section: RecipeEditSection;

	constructor(section: RecipeEditSection, error: unknown) {
		super(error instanceof Error ? error.message : "Unable to save this recipe.");
		this.name = "RecipeEditSaveError";
		this.section = section;
	}
}

export async function getRecipeDetail(recipeId: number): Promise<RecipeDetail> {
	const response = await axios.get(apiRoutes.recipe(recipeId));
	return response.data?.recipe ?? response.data;
}

export async function saveRecipeEdits(recipeId: number, payload: RecipeEditPayload): Promise<RecipeDetail> {
	try {
		await axios.patch(apiRoutes.recipe(recipeId), payload.base);
	} catch (error) {
		throw new RecipeEditSaveError("base", error);
	}

	if (payload.ingredients !== undefined) {
		try {
			await axios.put(apiRoutes.recipeIngredients(recipeId), payload.ingredients);
		} catch (error) {
			throw new RecipeEditSaveError("ingredients", error);
		}
	}

	if (payload.nutrition !== undefined) {
		try {
			await axios.put(apiRoutes.recipeNutrition(recipeId), payload.nutrition);
		} catch (error) {
			throw new RecipeEditSaveError("nutrition", error);
		}
	}

	if (payload.tags !== undefined) {
		try {
			await axios.put(apiRoutes.recipeDietaryTags(recipeId), payload.tags);
		} catch (error) {
			throw new RecipeEditSaveError("tags", error);
		}
	}

	try {
		return await getRecipeDetail(recipeId);
	} catch (error) {
		throw new RecipeEditSaveError("refresh", error);
	}
}
