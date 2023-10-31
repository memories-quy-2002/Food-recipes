import React, { useContext, useEffect, useState } from "react";
import axios from "../../api/axios";
import { RecipeContext } from "../../context/RecipeProvider";
import convertImage from "../../utils/convertImage";

const MenuBar = () => {
	const { recipes } = useContext(RecipeContext);
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get("/category/");
				setCategories(response.data.categories);
			} catch (err) {
				throw err;
			}
		};
		const fetchMeals = async () => {
			try {
				const response = await axios.get("/meal/");
				setMeals(response.data.meals);
			} catch (err) {
				throw err;
			}
		};
		fetchCategories();
		fetchMeals();
	}, []);
	return (
		<div className="food__menubar">
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Search Food</h5>
				<input
					type="text"
					name="search_recipe"
					placeholder="Search..."
				/>
			</div>
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Categories</h5>
				<ul className="food__menubar__section__list">
					{categories.map(({ category_id, category_name }) => (
						<li key={category_id}>
							<a href={`/food?category=${category_id}`}>
								<strong>{category_name}</strong>
							</a>
						</li>
					))}
				</ul>
			</div>
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Meals</h5>
				<ul className="food__menubar__section__list">
					{meals.map(({ meal_id, meal_name }) => (
						<li key={meal_id}>
							<a href={`/food?meal=${meal_id}`}>
								<strong>{meal_name}</strong>
							</a>
						</li>
					))}
				</ul>
			</div>
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Popular Food</h5>
				<ul className="food__menubar__section__list">
					{recipes.slice(0, 3).map(({ recipe_name, recipe_id }) => (
						<li key={recipe_id}>
							<div className="food__menubar__section__popular">
								{convertImage(
									recipe_name,
									"food__menubar__section__popular__img"
								)}
								<p>{recipe_name}</p>
							</div>
						</li>
					))}
					<li>
						<div></div>
					</li>
				</ul>
			</div>
		</div>
	);
};

export default MenuBar;
