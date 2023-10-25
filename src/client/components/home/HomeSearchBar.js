import React, { useContext, useState } from "react";
import { RecipeContext } from "../../../App";

const HomeSearchBar = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const { recipes } = useContext(RecipeContext);
	const handleChange = (e) => {
		setSearchTerm(e.target.value);
	};
	const filterRecipes = recipes.filter((recipe) =>
		recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	return (
		<div className="home__main__search">
			<input
				type="text"
				placeholder="Search..."
				onChange={handleChange}
			></input>
			{searchTerm && (
				<ul className="home__main__search__result">
					{filterRecipes.map((recipe) => (
						<li key={recipe.recipe_id}>{recipe.recipe_name}</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default HomeSearchBar;
