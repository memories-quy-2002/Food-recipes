import React from "react";
import { Link } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";

const FoodContentSectionItem = ({ recipe }) => {
	const {
		recipe_id,
		recipe_name,
		overall_score,
		num_ratings,
		category_name,
		meal_name,
	} = recipe;

	return (
		<article
			className="food__content__section__list__item"
		>
			<Link
				className="food__content__section__list__item__link"
				to={`/recipe?id=${recipe_id}`}
				aria-label={`Open ${recipe_name}`}
			>
				{convertImage(
					recipe_name,
					"food__content__section__list__item__img",
					recipe.image_url
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
			</Link>
		</article>
	);
};

export default FoodContentSectionItem;
