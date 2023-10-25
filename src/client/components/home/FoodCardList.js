import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FoodCard from "./FoodCard";
import axios from "../../api/axios";
import { RecipeContext } from "../../../App";

const FoodCardList = () => {
	const navigate = useNavigate();
	const { recipes } = useContext(RecipeContext);

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};
	return (
		<div className="home__main__cardList">
			{recipes.map((recipe, index) => {
				const { recipe_id, recipe_name, category_name, meal_name } =
					recipe;
				return (
					<FoodCard
						key={index}
						name={recipe_name}
						category={category_name}
						meal={meal_name}
						handleNavigate={() => handleNavigate(recipe_id)}
					/>
				);
			})}
		</div>
	);
};

export default FoodCardList;
