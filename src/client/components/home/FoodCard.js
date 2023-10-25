import React from "react";
import convertImage from "../../utils/convertImage";

const FoodCard = ({ name, category, meal, handleNavigate }) => {
	return (
		<div className="home__main__card" onClick={handleNavigate}>
			{convertImage(name, "home__main__card__img")}
			<strong className="home__main__card__category">
				{category.toUpperCase()}
			</strong>
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__meal">Meal: {meal}</p>
		</div>
	);
};

export default FoodCard;
