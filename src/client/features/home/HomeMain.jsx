import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import CategorySection from "./main/CategorySection";
import FoodCardList from "./main/FoodCardList";
import HomeSearchBar from "./main/HomeSearchBar";
import PageState from "@/shared/ui/PageState";
const HomeMain = () => {
	const [categories, setCategories] = useState([]);
	const [wishlist, setWishlist] = useState([]);
	const [categoryError, setCategoryError] = useState(null);
	const { recipes, isLoadingRecipes, recipesError } = useContext(RecipeContext);
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
				setCategoryError(null);
				const response = await axios.get("/category");
				setCategories(getArrayPayload(response.data, "categories"));
			} catch (err) {
				console.error(err);
				setCategoryError(
					err.response?.data?.message ||
						"Unable to load recipe categories."
				);
			}
		};
		fetchCategories();
	}, [userId]);
	useEffect(() => {
		const fetchWishlists = async () => {
			try {
				const response = await axios.get(`/wishlist/${userId}`);
				if (response.status === 200) {
					setWishlist(getArrayPayload(response.data, "wishlist"));
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchWishlists();
	}, [userId]);
	return (
		<div className="home__main">
			{isLoadingRecipes ? (
				<PageState
					title="Loading recipes"
					message="Fetching recipes for search and featured cards."
				/>
			) : recipesError ? (
				<PageState
					type="error"
					title="Recipes could not load"
					message={recipesError}
				/>
			) : (
				<>
					<HomeSearchBar recipes={recipes} />
					{categoryError ? (
						<PageState
							type="error"
							title="Categories could not load"
							message={categoryError}
						/>
					) : (
						<CategorySection categories={categories} />
					)}
					<FoodCardList
						recipes={recipes}
						wishlist={wishlist}
						onClickFavorite={handleClickFavorite}
					/>
				</>
			)}
		</div>
	);
};

export default HomeMain;
