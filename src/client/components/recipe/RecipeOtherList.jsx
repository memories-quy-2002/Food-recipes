import React, { useContext, useEffect, useState } from "react";
import { RecipeContext } from "../../context/RecipeProvider";
import { useNavigate } from "react-router-dom";
import convertImage from "../../utils/convertImage";
import ratingStar from "../../utils/ratingStar";
const RecipeOtherList = ({ recipeId }) => {
	const { recipes } = useContext(RecipeContext);
	const [shuffledRecipes, setShuffledRecipes] = useState([]);
	const navigate = useNavigate();
	const handleNavigation = (recipeId) => {
		navigate(`/recipe?id=${recipeId}`);
		window.location.reload();
	};
	useEffect(() => {
		const sortRecipes = recipes.sort(() => Math.random() - 0.5);
		setShuffledRecipes(
			sortRecipes
				.filter((recipe) => recipe.recipe_id !== recipeId)
				.slice(0, 5)
		);
	}, [recipeId, recipes]);
	return (
		<div className="recipe__container__other">
			<h5 className="recipe__container__other__title">Other Recipes</h5>
			<div className="recipe__container__other__list">
				{shuffledRecipes.map((recipe) => (
					<div
						key={recipe.recipe_id}
						className="recipe__container__other__list__item"
						onClick={() => handleNavigation(recipe.recipe_id)}
					>
						{convertImage(
							recipe.recipe_name,
							"recipe__container__other__list__item__img"
						)}

						<div className="recipe__container__other__list__item__context">
							<strong>{recipe.recipe_name}</strong>
						</div>
						<div
							className="mx-3 d-flex gap-2 align-items-center recipe__container__other__list__item__rating"
							style={{ height: "28px" }}
						>
							<div className="d-flex gap-1">
								{ratingStar(recipe.overall_score, "orange")}
							</div>
							<span style={{ fontSize: "12px" }}>
								{recipe.num_ratings} Ratings{" "}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default RecipeOtherList;
