import React from "react";
import { useNavigate } from "react-router-dom";
import FoodCard from "./FoodCard";

const featuredModes = [
	{ id: "top-rated", label: "Top rated" },
	{ id: "most-reviewed", label: "Most reviewed" },
	{ id: "quick-meals", label: "Quick meals" },
];

const FoodCardList = ({
	recipes,
	wishlist,
	onClickFavorite,
	featuredMode,
	onFeaturedModeChange,
}) => {
	const navigate = useNavigate();

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};

	return (
		<div className="home__main__cardList">
			<div className="home__sectionHeader">
				<div>
					<span>Top rated</span>
					<h3 className="home__main__cardList__title">Featured recipes</h3>
				</div>
				<div className="home__main__cardList__controls">
					<div className="home__main__cardList__tabs" role="tablist">
						{featuredModes.map((mode) => (
							<button
								key={mode.id}
								type="button"
								className={`home__main__cardList__tab ${
									featuredMode === mode.id
										? "home__main__cardList__tab--active"
										: ""
								}`}
								onClick={() => onFeaturedModeChange(mode.id)}
							>
								{mode.label}
							</button>
						))}
					</div>
					<a href="/food" className="home__main__cardList__link">
						Explore all recipes
					</a>
				</div>
			</div>
			<div className="home__main__cardList__feature">
				{recipes
					.map(
						({
							recipe_id,
							recipe_name,
							category_name,
							meal_name,
							num_ratings,
							overall_score,
							image_url,
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
									imageUrl={image_url}
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
		</div>
	);
};

export default FoodCardList;
