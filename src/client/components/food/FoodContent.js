import React, { useContext } from "react";
import { RecipeContext } from "../../context/RecipeProvider";
import convertImage from "../../utils/convertImage";
import { useNavigate } from "react-router-dom";
import ratingStar from "../../utils/ratingStar";

const FoodContent = ({ categoryId, mealId }) => {
	const navigate = useNavigate();
	let { recipes } = useContext(RecipeContext);
	if (mealId) {
		recipes = recipes.filter(
			(recipe) => recipe.meal_id === parseInt(mealId)
		);
	}
	let categories = recipes
		.map(({ category_id: id, category_name: name }) => ({ id, name }))
		.filter(
			(category, index, self) =>
				index === self.findIndex((c) => c.id === category.id)
		)
		.sort((a, b) => a.id - b.id);

	if (categoryId) {
		categories = categories.filter(
			(category) => category.id === parseInt(categoryId)
		);
	}

	return (
		<div className="food__content">
			{categories.map(({ id, name }) => (
				<div key={id} className="food__content__section">
					<h4 className="food__content__section__title">{name}</h4>
					<div className="food__content__section__list">
						{recipes
							.sort((a, b) => b.num_ratings - a.num_ratings)
							.filter((recipe) => recipe.category_name === name)
							.map(
								({
									recipe_id,
									recipe_name,
									overall_score,
									num_ratings,
								}) => (
									<div
										key={recipe_id}
										className="food__content__section__list__item"
										onClick={() =>
											navigate(`/recipe?id=${recipe_id}`)
										}
									>
										{convertImage(
											recipe_name,
											"food__content__section__list__item__img"
										)}

										<div className="food__content__section__list__item__context">
											<strong>{recipe_name}</strong>
										</div>
										<div
											className="mx-3 d-flex gap-2 align-items-center"
											style={{ height: "28px" }}
										>
											<div className="d-flex gap-1">
												{ratingStar(
													overall_score,
													"orange"
												)}
											</div>
											<span style={{ fontSize: "12px" }}>
												{num_ratings} Ratings{" "}
											</span>
										</div>
									</div>
								)
							)}
					</div>
				</div>
			))}
		</div>
	);
};

export default FoodContent;
