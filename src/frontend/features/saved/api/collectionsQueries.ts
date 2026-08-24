import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addRecipeToCollection,
	createCollection,
	deleteCollection,
	listCollectionRecipes,
	listCollections,
	removeRecipeFromCollection,
	renameCollection,
	type SavedCollection,
} from "./collectionsApi";

export const collectionsQueryKeys = {
	all: ["saved-collections"] as const,
	list: () => ["saved-collections", "list"] as const,
	recipes: (collectionId: number) => ["saved-collections", "recipes", collectionId] as const,
};

const invalidateCollections = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.all });
};

export const useCollectionsQuery = (enabled = true) => useQuery({
	queryKey: collectionsQueryKeys.list(),
	queryFn: ({ signal }) => listCollections(signal),
	enabled,
});

export const useCollectionRecipesQuery = (collectionId: number | null, enabled = true) => useQuery({
	queryKey: collectionsQueryKeys.recipes(collectionId ?? 0),
	queryFn: ({ signal }) => listCollectionRecipes(collectionId as number, signal),
	enabled: enabled && Number.isInteger(collectionId) && Number(collectionId) > 0,
});

export const useCreateCollectionMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (name: string) => createCollection(name),
		onSuccess: () => invalidateCollections(queryClient),
	});
};

export const useRenameCollectionMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ collectionId, name }: { collectionId: number; name: string }) => renameCollection(collectionId, name),
		onSuccess: () => invalidateCollections(queryClient),
	});
};

export const useDeleteCollectionMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (collectionId: number) => deleteCollection(collectionId),
		onSuccess: () => invalidateCollections(queryClient),
	});
};

export const useAddRecipeToCollectionMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ collectionId, recipeId }: { collectionId: number; recipeId: number }) => addRecipeToCollection(collectionId, recipeId),
		onSuccess: () => invalidateCollections(queryClient),
	});
};

export const useRemoveRecipeFromCollectionMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ collectionId, recipeId }: { collectionId: number; recipeId: number }) => removeRecipeFromCollection(collectionId, recipeId),
		onSuccess: () => invalidateCollections(queryClient),
	});
};

export type { SavedCollection };
