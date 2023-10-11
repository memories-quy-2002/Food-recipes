import React from "react";
const FoodCard = ({ src, name, desc }) => {
	return (
		<div className="home__main__card">
			<img
				src={require(`../../assets/images/${src.toLowerCase()}.png`)}
				alt="this"
				width={120}
				className="home__main__card__img"
			></img>
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__desc">{desc}</p>
			<button type="button" className="home__main__card__button">
				View
			</button>
		</div>
	);
};

export default FoodCard;
