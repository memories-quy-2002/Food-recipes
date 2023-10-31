import React, { useContext, useState } from "react";
import convertImage from "../../utils/convertImage";
import { useNavigate } from "react-router-dom";
import { RecipeContext } from "../../context/RecipeProvider";

const HomeSearchBar = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();
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
					{filterRecipes.length > 0 ? (
						filterRecipes.map((recipe) => (
							<li
								key={recipe.recipe_id}
								onClick={() =>
									navigate(`/recipe?id=${recipe.recipe_id}`)
								}
							>
								{convertImage(
									recipe.recipe_name,
									"home__main__search__result__img"
								)}
								<p>{recipe.recipe_name}</p>
							</li>
						))
					) : (
						<li>No recipe found</li>
					)}
				</ul>
			)}
		</div>
	);
};

export default HomeSearchBar;
