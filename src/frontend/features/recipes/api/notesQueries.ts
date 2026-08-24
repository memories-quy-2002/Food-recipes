import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRecipeNote, getRecipeNote, saveRecipeNote } from "./notesApi";

export const recipeNoteQueryKeys = {
	all: ["recipe-notes"] as const,
	detail: (recipeId: number) => ["recipe-notes", recipeId] as const,
};

export const useRecipeNoteQuery = (recipeId: number | null, enabled = true) => useQuery({
	queryKey: recipeNoteQueryKeys.detail(Number(recipeId) || 0),
	queryFn: ({ signal }) => getRecipeNote(Number(recipeId), signal),
	enabled: enabled && Number.isInteger(recipeId) && Number(recipeId) > 0,
});

export const useSaveRecipeNoteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ recipeId, note }: { recipeId: number; note: string }) => saveRecipeNote(recipeId, note),
		onSuccess: (data, variables) => queryClient.setQueryData(recipeNoteQueryKeys.detail(variables.recipeId), data),
	});
};

export const useDeleteRecipeNoteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (recipeId: number) => deleteRecipeNote(recipeId),
		onSuccess: (_data, recipeId) => queryClient.setQueryData(recipeNoteQueryKeys.detail(recipeId), { note: null }),
	});
};
