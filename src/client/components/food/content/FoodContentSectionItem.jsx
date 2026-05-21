import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../../utils/convertImage";
import ratingStar from "../../../utils/ratingStar";

const FoodContentSectionItem = ({ recipe }) => {
	const navigate = useNavigate();
	const {
		recipe_id,
		recipe_name,
		overall_score,
		num_ratings,
		category_name,
		meal_name,
	} = recipe;

	const handleOpenRecipe = () => {
		navigate(`/recipe?id=${recipe_id}`);
	};

	const handleKeyDown = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleOpenRecipe();
		}
	};

	return (
		<article
			key={recipe_id}
			className="food__content__section__list__item"
			onClick={handleOpenRecipe}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`Open ${recipe_name}`}
		>
			{convertImage(
				recipe_name,
				"food__content__section__list__item__img"
			)}

			<div className="food__content__section__list__item__context">
				<div className="food__content__section__list__item__chips">
					<span>{category_name}</span>
					<span>{meal_name}</span>
				</div>
				<strong>{recipe_name}</strong>
				<div className="food__content__section__list__item__rating">
					<div>{ratingStar(overall_score, "orange")}</div>
					<span>
						{Number(overall_score || 0).toFixed(1)} ({num_ratings} ratings)
					</span>
				</div>
			</div>
		</article>
	);
};

export default FoodContentSectionItem;
