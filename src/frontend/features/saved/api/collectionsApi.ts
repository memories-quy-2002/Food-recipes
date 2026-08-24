import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { RecipeSummary } from "@/shared/api/contracts";

export type SavedCollection = {
	collection_id: number;
	name: string;
	recipe_count: number;
	created_at: string;
	updated_at: string;
};

export type CollectionsResponse = { collections: SavedCollection[] };
export type CollectionResponse = { collection: SavedCollection };
export type CollectionRecipesResponse = { recipes: RecipeSummary[] };
export type CollectionMessageResponse = { message: string };

export const listCollections = async (signal?: AbortSignal): Promise<CollectionsResponse> => {
	const response = await axios.get<CollectionsResponse>(apiRoutes.userCollections, { signal });
	return response.data;
};

export const listCollectionRecipes = async (
	collectionId: number,
	signal?: AbortSignal,
): Promise<CollectionRecipesResponse> => {
	const response = await axios.get<CollectionRecipesResponse>(apiRoutes.userCollectionRecipes(collectionId), { signal });
	return response.data;
};

export const createCollection = async (name: string): Promise<CollectionResponse> => {
	const response = await axios.post<CollectionResponse>(apiRoutes.userCollections, { name });
	return response.data;
};

export const renameCollection = async (collectionId: number, name: string): Promise<CollectionResponse> => {
	const response = await axios.patch<CollectionResponse>(apiRoutes.userCollection(collectionId), { name });
	return response.data;
};

export const deleteCollection = async (collectionId: number): Promise<CollectionMessageResponse> => {
	const response = await axios.delete<CollectionMessageResponse>(apiRoutes.userCollection(collectionId));
	return response.data;
};

export const addRecipeToCollection = async (collectionId: number, recipeId: number): Promise<CollectionResponse> => {
	const response = await axios.post<CollectionResponse>(apiRoutes.userCollectionRecipes(collectionId), { recipeId });
	return response.data;
};

export const removeRecipeFromCollection = async (collectionId: number, recipeId: number): Promise<CollectionMessageResponse> => {
	const response = await axios.delete<CollectionMessageResponse>(apiRoutes.userCollectionRecipe(collectionId, recipeId));
	return response.data;
};
