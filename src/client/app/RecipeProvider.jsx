import React, { createContext, useCallback, useEffect, useState } from "react";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
export const RecipeContext = createContext({});
const RecipeProvider = ({ children }) => {
	const [recipes, setRecipes] = useState([]);
	const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
	const [recipesError, setRecipesError] = useState(null);

	const refreshRecipes = useCallback(async () => {
		try {
			setIsLoadingRecipes(true);
			setRecipesError(null);
			const response = await axios.get(apiRoutes.recipes);
			setRecipes(getArrayPayload(response.data, "recipes"));
		} catch (err) {
			console.error(err);
			setRecipes([]);
			setRecipesError(
				err.response?.data?.message ||
					"Unable to load recipes from the server."
			);
			throw err;
		} finally {
			setIsLoadingRecipes(false);
		}
	}, []);

	useEffect(() => {
		refreshRecipes().catch(() => {});
	}, [refreshRecipes]);
	return (
		<RecipeContext.Provider
			value={{ recipes, isLoadingRecipes, recipesError, refreshRecipes }}
		>
			{children}
		</RecipeContext.Provider>
	);
};
export default RecipeProvider;
