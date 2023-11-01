import React, { useContext } from "react";
import { RecipeContext } from "../../context/RecipeProvider";
const categories = ["Breakfast", "Lunch", "Dinner", "Desserts"];

const FoodContent = () => {
	const { recipes } = useContext(RecipeContext);
	console.log(recipes);
	return (
		<div className="food__content">
			{categories.map((category, index) => (
				<div className="food__content__section">
					<h4 className="food__content__section__title">
						{category}
					</h4>
					<div className="food__content__section__list">
						{recipes.map(
							({ recipe_id, recipe_name, category_name }) => (
								<div
									key={recipe_id}
									className="food__content__section__list__item"
								>
									<img
										src={require("../../assets/images/background.png")}
										alt="breakfast"
										className="food__content__section__list__item__img"
									/>
									<div className="food__content__section__list__item__context">
										<h6 className="">{category_name}</h6>
										<strong>{recipe_name}</strong>
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
