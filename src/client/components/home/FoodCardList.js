import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { RecipeContext } from "../../context/RecipeProvider";
import convertImage from "../../utils/convertImage";
import FoodCard from "./FoodCard";

const FoodCardList = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState([]);
	const [wishlist, setWishlist] = useState([]);
	const { recipes } = useContext(RecipeContext);
	const { local, session } = useSelector(({ auth }) => auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user_id = isAuthenticated
		? local.isAuthenticated
			? local.user.user_id
			: session.user.user_id
		: 0;

	const handleClickFavorite = async (recipe_id) => {
		if (!isAuthenticated) navigate("/account");
		try {
			await axios.post("/wishlist", {
				user_id,
				recipe_id,
			});
			window.location.reload(false);
		} catch (err) {
			console.error(err);
		}
	};

	const handleNavigate = (id) => {
		navigate(`/recipe?id=${id}`);
	};

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get("/category");
				setCategories(response.data.categories);
			} catch (err) {
				throw err;
			}
		};
		const fetchFavorites = async () => {
			const response = await axios.get(`/wishlist/${user_id}`);
			setWishlist(response.data.wishlist);
		};
		fetchCategories();
		fetchFavorites();
	}, [user_id]);

	return (
		<div className="home__main__cardList">
			<h3 className="home__main__cardList__title">Category</h3>
			<div className="home__main__cardList__category">
				{categories
					.slice(0, 5)
					.map(({ id: category_id, name: category_name }) => (
						<div
							key={category_id}
							className="home__main__cardList__category__item"
						>
							{convertImage(category_name)}
							<div className="home__main__cardList__category__item__content">
								<h4>{category_name}</h4>
								<a href={`/food?categories=${category_id}`}>
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
				{recipes
					.slice(0, 8)
					.map(
						({
							recipe_id,
							recipe_name,
							category_name,
							meal_name,
						}) => {
							return (
								<FoodCard
									key={recipe_id}
									id={recipe_id}
									name={recipe_name}
									category={category_name}
									meal={meal_name}
									favorite={wishlist.some(
										(recipe) =>
											recipe.recipe_id === recipe_id
									)}
									handleNavigate={() =>
										handleNavigate(recipe_id)
									}
									handleClickFavorite={() =>
										handleClickFavorite(recipe_id)
									}
								/>
							);
						}
					)}
			</div>

			<a href="/food" className="home__main__cardList__link">
				&#x2192; More recipes
			</a>
		</div>
	);
};

export default FoodCardList;
