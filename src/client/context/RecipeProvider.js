import React, { createContext, useState, useEffect } from "react";
import axios from "../api/axios";
export const RecipeContext = createContext({});
const RecipeProvider = ({ children }) => {
	const [recipes, setRecipes] = useState([]);
	useEffect(() => {
		const getRecipes = async () => {
			const response = await axios.get("/recipe");
			setRecipes(response.data.recipes);
		};
		getRecipes();
	}, []);
	return (
		<RecipeContext.Provider value={{ recipes }}>
			{children}
		</RecipeContext.Provider>
	);
};
export default RecipeProvider;
