import React from "react";
import FoodCard from "./FoodCard";

const foods = [
	{
		imgSrc: "hamburger",
		name: "Burger",
		desc: "This is a delicious burger",
	},
	{
		imgSrc: "hamburger",
		name: "French Chips",
		desc: "This is a delicious burger",
	},
	{
		imgSrc: "hamburger",
		name: "Fried Chicken",
		desc: "This is a delicious burger",
	},
	{
		imgSrc: "hamburger",
		name: "Salad",
		desc: "This is a delicious burger",
	},
	{
		imgSrc: "hamburger",
		name: "BBQ",
		desc: "This is a delicious burger",
	},
];

const FoodCardList = () => {
	return (
		<div className="home__main__cardList">
			{foods.map(({ imgSrc, name, desc }, index) => (
				<FoodCard key={index} src={imgSrc} name={name} desc={desc} />
			))}
		</div>
	);
};

export default FoodCardList;
