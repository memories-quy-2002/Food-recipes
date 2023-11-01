import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FoodCard from "./FoodCard";
import { RecipeContext } from "../../context/RecipeProvider";
import axios from "../../api/axios";
import convertImage from "../../utils/convertImage";

const FoodCardList = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState([]);
	const { recipes } = useContext(RecipeContext);

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get("/category/");
				setCategories(response.data.categories);
			} catch (err) {
				throw err;
			}
		};
		fetchCategories();
	}, []);
	return (
		<div className="home__main__cardList">
			<h3 className="home__main__cardList__title">Category</h3>
			<div className="home__main__cardList__category">
				{categories
					.slice(0, 5)
					.map(({ category_id, category_name }) => (
						<div
							key={category_id}
							className="home__main__cardList__category__item"
						>
							{convertImage(category_name)}
							<div className="home__main__cardList__category__item__content">
								<h4>{category_name}</h4>
								<a
									href={`/food?category=${category_name.toLowerCase()}`}
								>
									View all recipes
								</a>
							</div>
						</div>
					))}
			</div>
			<a href="/food" className="home__main__cardList__link">
				&#x2192; More categories
			</a>
			<h3 className="home__main__cardList__title">Feature recipes</h3>
			<div className="home__main__cardList__feature">
				{recipes.slice(0, 8).map((recipe, index) => {
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

			<a href="/food" className="home__main__cardList__link">
				&#x2192; More recipes
			</a>
		</div>
	);
};

export default FoodCardList;
