import React, { createContext, useState, useEffect } from "react";
import axios from "../api/axios";
import { getArrayPayload } from "../api/payload";
export const RecipeContext = createContext({});
const RecipeProvider = ({ children }) => {
	const [recipes, setRecipes] = useState([]);

	useEffect(() => {
		const getRecipes = async () => {
			try {
				const response = await axios.get("/recipe");
				setRecipes(getArrayPayload(response.data, "recipes"));
			} catch (err) {
				console.error(err);
				setRecipes([]);
			}
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
