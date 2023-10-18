import React, { useEffect, useState } from "react";
import FoodCard from "./FoodCard";
import axios from "../../api/axios";

const FoodCardList = () => {
	const [recipes, setRecipes] = useState([]);
	useEffect(() => {
		(async () => {
			const response = await axios.get("http://localhost:4000/recipe");
			setRecipes(response.data.recipes);
		})();
	}, []);
	return (
		<div className="home__main__cardList">
			{recipes.map(
				(
					{ recipe_id, recipe_name, recipe_description, category_id },
					index
				) => (
					<FoodCard
						key={index}
						id={recipe_id}
						name={recipe_name}
						desc={recipe_description}
						category={category_id}
					/>
				)
			)}
		</div>
	);
};

export default FoodCardList;
