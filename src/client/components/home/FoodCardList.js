import React from "react";
import FoodCard from "./FoodCard";

const FoodCardList = () => {
	return (
		<div className="home__main__cardList">
			<FoodCard
				src="../../assets/images/hamburger.png"
				name="Burger"
				desc="This is a delicious burger"
			/>
			<FoodCard
				src="../../assets/images/hamburger.png"
				name="Burger"
				desc="This is a delicious burger"
			/>
			<FoodCard
				src="../../assets/images/hamburger.png"
				name="Burger"
				desc="This is a delicious burger"
			/>
			<FoodCard
				src="../../assets/images/hamburger.png"
				name="Burger"
				desc="This is a delicious burger"
			/>
			<FoodCard
				src="../../assets/images/hamburger.png"
				name="Burger"
				desc="This is a delicious burger"
			/>
		</div>
	);
};

export default FoodCardList;
