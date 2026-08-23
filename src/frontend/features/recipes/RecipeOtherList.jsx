import React, { useContext, useMemo } from "react";
import { RecipeContext } from "@/app/RecipeProvider";
import { Link } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";
const RecipeOtherList = ({ recipeId }) => {
	const { recipes } = useContext(RecipeContext);
	const shuffledRecipes = useMemo(() => {
		const sortRecipes = [...recipes].sort(() => Math.random() - 0.5);
		return sortRecipes
			.filter((recipe) => recipe.recipe_id !== recipeId)
			.slice(0, 5);
	}, [recipeId, recipes]);
	return (
		<div className="recipe__container__other">
			<h2 className="recipe__container__other__title">Other Recipes</h2>
			<div className="recipe__container__other__list">
				{shuffledRecipes.map((recipe) => (
					<Link
						key={recipe.recipe_id}
						to={`/recipe?id=${recipe.recipe_id}`}
						className="recipe__container__other__list__item"
					>
						{convertImage(
							recipe.recipe_name,
							"recipe__container__other__list__item__img",
							recipe.image_url
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
					</Link>
				))}
			</div>
		</div>
	);
};

export default RecipeOtherList;
