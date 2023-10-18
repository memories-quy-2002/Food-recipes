import React from "react";
import { useNavigate } from "react-router-dom";
const FoodCard = ({ id, name, desc, category }) => {
	const navigate = useNavigate();
	const handleClick = (id) => {
		navigate(`/recipe/${id}`);
	};
	const img = name.toLowerCase().replace(" ", "_");
	return (
		<div className="home__main__card">
			<img
				src={require(`../../assets/images/${img}.png`)}
				alt="This"
				className="home__main__card__img"
			></img>
			<h5 className="home__main__card__name">{name}</h5>
			<p className="home__main__card__desc">{desc}</p>
			<p className="home__main__card__category">Category: {category}</p>
			<button
				type="button"
				className="home__main__card__button"
				onClick={() => handleClick(id)}
			>
				View
			</button>
		</div>
	);
};

export default FoodCard;
