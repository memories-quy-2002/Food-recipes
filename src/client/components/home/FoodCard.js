import React from "react";
import hamburger from "../../assets/images/hamburger.png";
const FoodCard = ({ src, name, desc }) => {
	return (
		<div className="home__main__card">
			<img
				src={hamburger}
				alt="this"
				width={120}
				className="home__main__card__img"
			></img>
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__desc">{desc}</p>
		</div>
	);
};

export default FoodCard;
