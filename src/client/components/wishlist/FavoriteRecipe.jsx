import React from "react";
import { BsTrash3 } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import convertImage from "../../utils/convertImage";
import ratingStar from "../../utils/ratingStar";

const FavoriteRecipe = ({ recipe, handleShowModal }) => {
	const navigate = useNavigate();

	return (
		<li className="wishlist__main__content__list__item">
			<div className="wishlist__main__content__list__item__media">
				{convertImage(
					recipe.recipe_name,
					"wishlist__main__content__list__item__img"
				)}
			</div>
			<div className="wishlist__main__content__list__item__context">
				<div className="wishlist__main__content__list__item__chips">
					<span>{recipe.category_name}</span>
					<span>{recipe.meal_name}</span>
				</div>
				<strong>{recipe.recipe_name}</strong>
				<div className="wishlist__main__content__list__item__rating">
					<div>{ratingStar(recipe.overall_score, "orange")}</div>
					<span>
						{Number(recipe.overall_score || 0).toFixed(1)} (
						{recipe.num_ratings} ratings)
					</span>
				</div>
			</div>
			<div className="wishlist__main__content__list__item__actions">
				<button
					type="button"
					className="wishlist__main__content__list__item__button"
					onClick={() => navigate(`/recipe?id=${recipe.recipe_id}`)}
				>
					View
				</button>
				<button
					type="button"
					className="wishlist__main__content__list__item__button wishlist__main__content__list__item__button--danger"
					onClick={handleShowModal}
					aria-label={`Remove ${recipe.recipe_name}`}
				>
					<BsTrash3 />
				</button>
			</div>
		</li>
	);
};

export default FavoriteRecipe;
