import React, { createContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	recipeQueryKeys,
	useAllRecipesQuery,
} from "@/features/recipes/api/useRecipeQueries";
export const RecipeContext = createContext({});
const RecipeProvider = ({ children }) => {
	const queryClient = useQueryClient();
	const { data, isLoading, error } = useAllRecipesQuery();
	const recipes = data || [];
	const isLoadingRecipes = isLoading;
	const recipesError =
		error?.response?.data?.message ||
		(error ? "Unable to load recipes from the server." : null);

	const refreshRecipes = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: recipeQueryKeys.list(),
			}),
		[queryClient]
	);
	return (
		<RecipeContext.Provider
			value={{ recipes, isLoadingRecipes, recipesError, refreshRecipes }}
		>
			{children}
		</RecipeContext.Provider>
	);
};
export default RecipeProvider;
