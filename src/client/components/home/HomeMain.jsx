import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthProvider";
import { RecipeContext } from "../../context/RecipeProvider";
import CategorySection from "./main/CategorySection";
import FoodCardList from "./main/FoodCardList";
import HomeSearchBar from "./main/HomeSearchBar";
const HomeMain = () => {
	const [categories, setCategories] = useState([]);
	const [wishlist, setWishlist] = useState([]);
	const { recipes } = useContext(RecipeContext);
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const navigate = useNavigate();

	const handleClickFavorite = async (recipeId) => {
		if (!isAuthenticated) navigate("/account");
		try {
			await axios.post("/wishlist", {
				user_id: userId,
				recipe_id: recipeId,
			});
			window.location.reload(false);
		} catch (err) {
			console.error(err);
		}
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
		fetchCategories();
	}, [userId]);
	useEffect(() => {
		const fetchWishlists = async () => {
			try {
				const response = await axios.get(`/wishlist/${userId}`);
				if (response.status === 200) {
					setWishlist(response.data.wishlist);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchWishlists();
	}, [userId]);
	return (
		<div className="home__main">
			<HomeSearchBar recipes={recipes} />
			<CategorySection categories={categories} />
			<FoodCardList
				recipes={recipes}
				wishlist={wishlist}
				onClickFavorite={handleClickFavorite}
			/>
		</div>
	);
};

export default HomeMain;
