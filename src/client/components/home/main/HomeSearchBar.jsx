import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../../utils/convertImage";

const HomeSearchBar = ({ recipes }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();
	const handleChange = (e) => {
		setSearchTerm(e.target.value);
	};
	const filteredRecipes = recipes.filter((recipe) =>
		recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	return (
		<div className="home__main__title">
			<h3>Find your recipes</h3>
			<div className="home__main__search">
				<input
					type="text"
					placeholder="Search..."
					className="home__main__search__input"
					onChange={handleChange}
				></input>
				{searchTerm && (
					<ul className="home__main__search__result">
						{filteredRecipes.length > 0 ? (
							filteredRecipes.map((recipe) => (
								<li
									key={recipe.recipe_id}
									onClick={() =>
										navigate(
											`/recipe?id=${recipe.recipe_id}`
										)
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
		</div>
	);
};

export default HomeSearchBar;
