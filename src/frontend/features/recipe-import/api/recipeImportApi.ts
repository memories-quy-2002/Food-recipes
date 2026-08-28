import api from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type RecipeImportPreview = {
	name: string;
	description?: string;
	imageUrl?: string;
	ingredients: string[];
	instructions: string[];
	prepTimeMinutes?: number;
	cookTimeMinutes?: number;
	servings?: number;
	sourceUrl: string;
};

export type ImportedRecipeDraft = Omit<RecipeImportPreview, "sourceUrl" | "servings"> & {
	sourceUrl: string;
};

export const previewRecipeImport = async (
	url: string,
): Promise<RecipeImportPreview> => {
	const response = await api.post<{ preview: RecipeImportPreview }>(
		apiRoutes.recipeImportPreview,
		{ url },
	);
	return response.data.preview;
};

export const saveImportedRecipeDraft = async (
	draft: ImportedRecipeDraft,
): Promise<unknown> => {
	const response = await api.post(apiRoutes.recipeImportDrafts, draft);
	return response.data;
};
