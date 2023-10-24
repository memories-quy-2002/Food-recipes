import React from "react";
import convertImage from "../../utils/convertImage";

const FoodCard = ({ name, desc, category, meal, handleNavigate }) => {
	return (
		<div className="home__main__card">
			{convertImage(name, "home__main__card__img")}
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__desc">{desc}</p>
			<p className="home__main__card__category">Category: {category}</p>
			<p className="home__main__card__meal">Meal: {meal}</p>
			<button
				type="button"
				className="home__main__card__button"
				onClick={handleNavigate}
			>
				View
			</button>
		</div>
	);
};

export default FoodCard;
