import {
	createContext,
	useCallback,
	type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { RecipeSummary } from "@/shared/api/contracts";
import {
	recipeQueryKeys,
	useAllRecipesQuery,
} from "@/features/recipes/api/useRecipeQueries";

export type RecipeContextValue = {
	recipes: RecipeSummary[];
	isLoadingRecipes: boolean;
	recipesError: string | null;
	refreshRecipes: () => Promise<void>;
};

export const RecipeContext = createContext<RecipeContextValue>({
	recipes: [],
	isLoadingRecipes: false,
	recipesError: null,
	refreshRecipes: async () => undefined,
});

const RecipeProvider = ({
	children,
}: PropsWithChildren): React.ReactElement => {
	const queryClient = useQueryClient();
	const { data, isLoading, error } = useAllRecipesQuery();
	const recipes = data || [];
	const isLoadingRecipes = isLoading;
	const apiErrorMessage =
		isAxiosError(error) && typeof error.response?.data?.message === "string"
			? error.response.data.message
			: undefined;
	const recipesError =
		apiErrorMessage ??
		(error ? "Unable to load recipes from the server." : null);

	const refreshRecipes = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: recipeQueryKeys.list(),
			}),
		[queryClient],
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
