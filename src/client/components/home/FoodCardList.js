import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeContext } from "../../../App";
import FoodCard from "./FoodCard";

const FoodCardList = () => {
	const navigate = useNavigate();
	const { recipes } = useContext(RecipeContext);

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};
	return (
		<div className="home__main__cardList">
			<h3 className="home__main__cardList__title">Feature recipes</h3>
			<div className="home__main__cardList__list">
				{recipes.map((recipe, index) => {
					const { recipe_id, recipe_name, category_name, meal_name } =
						recipe;
					return (
						<FoodCard
							key={index}
							name={recipe_name}
							category={category_name}
							meal={meal_name}
							handleNavigate={() => handleNavigate(recipe_id)}
						/>
					);
				})}
			</div>

			<a href="/food" className="home__main__cardList__link">
				&#x2192; More recipes
			</a>
		</div>
	);
};

export default FoodCardList;
