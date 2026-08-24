import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type RecipeNote = {
	user_id: number;
	recipe_id: number;
	note: string;
	updated_at: string;
};

export type RecipeNoteResponse = { note: RecipeNote | null };

export const getRecipeNote = async (recipeId: number, signal?: AbortSignal) => {
	const response = await axios.get<RecipeNoteResponse>(apiRoutes.userRecipeNote(recipeId), { signal });
	return response.data;
};

export const saveRecipeNote = async (recipeId: number, note: string) => {
	const response = await axios.patch<RecipeNoteResponse>(apiRoutes.userRecipeNote(recipeId), { note });
	return response.data;
};

export const deleteRecipeNote = async (recipeId: number) => {
	const response = await axios.delete<{ message: string }>(apiRoutes.userRecipeNote(recipeId));
	return response.data;
};
