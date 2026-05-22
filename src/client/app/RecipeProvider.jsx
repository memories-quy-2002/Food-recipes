import React, { createContext, useState, useEffect } from "react";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
export const RecipeContext = createContext({});
const RecipeProvider = ({ children }) => {
	const [recipes, setRecipes] = useState([]);
	const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
	const [recipesError, setRecipesError] = useState(null);

	useEffect(() => {
		const getRecipes = async () => {
			try {
				setIsLoadingRecipes(true);
				setRecipesError(null);
				const response = await axios.get("/recipe");
				setRecipes(getArrayPayload(response.data, "recipes"));
			} catch (err) {
				console.error(err);
				setRecipes([]);
				setRecipesError(
					err.response?.data?.message ||
						"Unable to load recipes from the server."
				);
			} finally {
				setIsLoadingRecipes(false);
			}
		};
		getRecipes();
	}, []);
	return (
		<RecipeContext.Provider
			value={{ recipes, isLoadingRecipes, recipesError }}
		>
			{children}
		</RecipeContext.Provider>
	);
};
export default RecipeProvider;
