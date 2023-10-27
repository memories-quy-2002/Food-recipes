import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import axios from "./client/api/axios";
import Account from "./client/pages/Account";
import Food from "./client/pages/Food";
import Home from "./client/pages/Home";
import Profile from "./client/pages/Profile";
import Recipe from "./client/pages/Recipe";
import Wishlist from "./client/pages/Wishlist";

export const RecipeContext = createContext();
function App() {
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
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/food" element={<Food />} />
					<Route path="/account" element={<Account />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/recipe" element={<Recipe />} />
					<Route path="/wishlist" element={<Wishlist />}></Route>
				</Routes>
			</BrowserRouter>
		</RecipeContext.Provider>
	);
}

export default App;
