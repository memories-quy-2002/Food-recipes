import React from "react";
import { useNavigate } from "react-router-dom";
import FoodCard from "./FoodCard";

const FoodCardList = ({ recipes, wishlist, onClickFavorite }) => {
	const navigate = useNavigate();

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};

	return (
		<div className="home__main__cardList">
			<h3 className="home__main__cardList__title">Feature recipes</h3>
			<div className="home__main__cardList__feature">
				{recipes
					.sort((a, b) => b.num_ratings - a.num_ratings)
					.slice(0, 8)
					.map(
						({
							recipe_id,
							recipe_name,
							category_name,
							meal_name,
							num_ratings,
							overall_score,
						}) => {
							return (
								<FoodCard
									key={recipe_id}
									id={recipe_id}
									name={recipe_name}
									category={category_name}
									meal={meal_name}
									ratings={num_ratings}
									score={overall_score}
									favorite={wishlist.some(
										(recipe) =>
											recipe.recipe_id === recipe_id
									)}
									onNavigate={() => handleNavigate(recipe_id)}
									onClickFavorite={() =>
										onClickFavorite(recipe_id)
									}
								/>
							);
						}
					)}
			</div>

			<a href="/food" className="home__main__cardList__link">
				&#x2192; More recipes
			</a>
		</div>
	);
};

export default FoodCardList;
