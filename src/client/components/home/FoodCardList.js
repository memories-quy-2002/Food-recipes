import React, { useEffect, useState } from "react";
import FoodCard from "./FoodCard";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";

const FoodCardList = () => {
	const [recipes, setRecipes] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			const response = await axios.get("http://localhost:4000/recipe");
			setRecipes(response.data.recipes);
		})();
	}, []);

	const onClickNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};

	return (
		<div className="home__main__cardList">
			{recipes.map(
				(
					{ recipe_id, recipe_name, recipe_description, category_id },
					index
				) => (
					<FoodCard
						key={index}
						name={recipe_name}
						desc={recipe_description}
						category={category_id}
						onNavigate={() => onClickNavigate(recipe_id)}
					/>
				)
			)}
		</div>
	);
};

export default FoodCardList;
