import React, { useContext } from "react";
import { RecipeContext } from "../../context/RecipeProvider";
import convertImage from "../../utils/convertImage";
import { useNavigate } from "react-router-dom";

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
							.filter((recipe) => recipe.category_name === name)
							.map(({ recipe_id, recipe_name }) => (
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
								</div>
							))}
					</div>
				</div>
			))}
		</div>
	);
};

export default FoodContent;
