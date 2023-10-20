import React from "react";

const FoodCard = ({ name, desc, category, onNavigate }) => {
	const imgName = name.toLowerCase().replace(" ", "_");

	return (
		<div className="home__main__card">
			<img
				src={require(`../../assets/images/${imgName}.png`)}
				alt="This"
				className="home__main__card__img"
			></img>
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__desc">{desc}</p>
			<p className="home__main__card__category">Category: {category}</p>
			<button
				type="button"
				className="home__main__card__button"
				onClick={onNavigate}
			>
				View
			</button>
		</div>
	);
};

export default FoodCard;
