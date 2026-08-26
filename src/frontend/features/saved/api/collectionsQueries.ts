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
import { useToast } from "@/app/ToastProvider";

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

export const useCollectionRecipesQuery = (collectionId: number | null, enabled = true) => {
	const queryCollectionId =
		Number.isInteger(collectionId) && Number(collectionId) > 0 ? collectionId : null;

	return useQuery({
	queryKey: collectionsQueryKeys.recipes(queryCollectionId ?? 0),
	queryFn: ({ signal }) => {
		if (queryCollectionId === null) return Promise.reject(new Error("Collection ID is required"));
		return listCollectionRecipes(queryCollectionId, signal);
	},
	enabled: enabled && queryCollectionId !== null,
	});
};

export const useCreateCollectionMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (name: string) => createCollection(name),
		onSuccess: async () => { await invalidateCollections(queryClient); showToast({ title: "Collection created" }); },
		onError: () => showToast({ title: "Couldn’t create the collection", message: "Please try again.", type: "error" }),
	});
};

export const useRenameCollectionMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ collectionId, name }: { collectionId: number; name: string }) => renameCollection(collectionId, name),
		onSuccess: async () => { await invalidateCollections(queryClient); showToast({ title: "Collection renamed" }); },
		onError: () => showToast({ title: "Couldn’t rename the collection", message: "Please try again.", type: "error" }),
	});
};

export const useDeleteCollectionMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (collectionId: number) => deleteCollection(collectionId),
		onSuccess: async () => { await invalidateCollections(queryClient); showToast({ title: "Collection deleted" }); },
		onError: () => showToast({ title: "Couldn’t delete the collection", message: "Please try again.", type: "error" }),
	});
};

export const useAddRecipeToCollectionMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ collectionId, recipeId }: { collectionId: number; recipeId: number }) => addRecipeToCollection(collectionId, recipeId),
		onSuccess: async () => { await invalidateCollections(queryClient); showToast({ title: "Recipe saved to collection" }); },
		onError: () => showToast({ title: "Couldn’t save this recipe to the collection", message: "Please try again.", type: "error" }),
	});
};

export const useRemoveRecipeFromCollectionMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ collectionId, recipeId }: { collectionId: number; recipeId: number }) => removeRecipeFromCollection(collectionId, recipeId),
		onSuccess: async () => { await invalidateCollections(queryClient); showToast({ title: "Recipe removed from collection" }); },
		onError: () => showToast({ title: "Couldn’t remove this recipe", message: "Please try again.", type: "error" }),
	});
};

export type { SavedCollection };
