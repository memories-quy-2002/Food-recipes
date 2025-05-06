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
	return (
		<div
			key={recipe_id}
			className="food__content__section__list__item"
			onClick={() => navigate(`/recipe?id=${recipe_id}`)}
		>
			{convertImage(
				recipe_name,
				"food__content__section__list__item__img"
			)}

			<div className="food__content__section__list__item__context">
				<strong>{recipe_name}</strong>
				<p>Category: {category_name}</p>
				<p>Meal: {meal_name}</p>
			</div>
			<div
				className="mx-3 d-flex gap-2 align-items-center"
				style={{ height: "28px" }}
			>
				<div className="d-flex gap-1">
					{ratingStar(overall_score, "orange")}
				</div>
				<span style={{ fontSize: "12px" }}>{num_ratings} Ratings </span>
			</div>
		</div>
	);
};

export default FoodContentSectionItem;
