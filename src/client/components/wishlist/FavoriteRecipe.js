import React from "react";
import convertImage from "../../utils/convertImage";

const FavoriteRecipe = ({ recipe, handleDelete }) => {
	return (
		<li className="wishlist__main__content__list__item">
			<div className="wishlist__main__content__list__item__img">
				{convertImage(
					recipe.recipe_name,
					"wishlist__main__content__list__item__img"
				)}
			</div>
			<div className="wishlist__main__content__list__item__context">
				<strong>{recipe.recipe_name}</strong>
				<p>Category: {recipe.category_name}</p>
				<p>Meal: {recipe.meal_name}</p>
			</div>

			<button
				type="button"
				className="wishlist__main__content__list__item__button"
				onClick={handleDelete}
			>
				Delete
			</button>
		</li>
	);
};

export default FavoriteRecipe;
