import React, { useEffect, useState } from "react";
import FoodCard from "./FoodCard";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";

const FoodCardList = () => {
	const [recipes, setRecipes] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			const response = await axios.get("/recipe");
			setRecipes(response.data.recipes);
		})();
	}, []);

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};
	console.log(recipes);
	return (
		<div className="home__main__cardList">
			{recipes.map((recipe, index) => {
				const {
					recipe_id,
					recipe_name,
					recipe_description,
					category_name,
					meal_name,
				} = recipe;
				return (
					<FoodCard
						key={index}
						name={recipe_name}
						desc={recipe_description}
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
