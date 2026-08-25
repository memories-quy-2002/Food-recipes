import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import type { RecipeDetail } from "@/shared/api/contracts";
import { normalizeRecipeEditorValue } from "./recipeEditorApi";

export type RecipeEditorValue = RecipeDetail;

export const OWNED_RECIPE_NOT_FOUND = "OWNED_RECIPE_NOT_FOUND";

export class OwnedRecipeNotFoundError extends Error {
	code = OWNED_RECIPE_NOT_FOUND;

	constructor() {
		super("The recipe was not found in your cookbook.");
	}
}

export async function loadOwnedRecipe(recipeId: number): Promise<RecipeEditorValue> {
	const response = await axios.get(apiRoutes.userRecipes, { params: { status: "all" } });
	const recipe = getArrayPayload(response.data, "recipes")
		.find((item) => Number(item.recipe_id) === recipeId) as RecipeEditorValue | undefined;

	if (!recipe) throw new OwnedRecipeNotFoundError();

	return normalizeRecipeEditorValue(recipe as unknown as Record<string, unknown>) as RecipeEditorValue;
}
