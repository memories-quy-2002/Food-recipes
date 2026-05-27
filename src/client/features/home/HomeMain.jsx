import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import { useToast } from "@/app/ToastProvider";
import CategorySection from "./main/CategorySection";
import FoodCardList from "./main/FoodCardList";
import HomeSearchBar from "./main/HomeSearchBar";
import PageState from "@/shared/ui/PageState";
const HomeMain = () => {
	const [categories, setCategories] = useState([]);
	const [wishlist, setWishlist] = useState([]);
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState("all");
	const [featuredMode, setFeaturedMode] = useState("top-rated");
	const [categoryError, setCategoryError] = useState(null);
	const { recipes, isLoadingRecipes, recipesError } = useContext(RecipeContext);
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const { showToast } = useToast();
	const navigate = useNavigate();

	const filteredRecipes = useMemo(() => {
		if (selectedCategoryId === "all") return recipes;
		return recipes.filter(
			(recipe) => Number(recipe.category_id) === Number(selectedCategoryId)
		);
	}, [recipes, selectedCategoryId]);

	const getTimeValue = (value) => {
		if (!value) return Number.MAX_SAFE_INTEGER;
		const [amount] = String(value).split(" ");
		const parsed = Number(amount);
		return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
	};

	const featuredRecipes = useMemo(() => {
		const nextRecipes = [...filteredRecipes];

		if (featuredMode === "quick-meals") {
			return nextRecipes
				.sort(
					(a, b) =>
						getTimeValue(a.prep_time) + getTimeValue(a.cook_time) -
						(getTimeValue(b.prep_time) + getTimeValue(b.cook_time))
				)
				.slice(0, 8);
		}

		if (featuredMode === "most-reviewed") {
			return nextRecipes
				.sort((a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0))
				.slice(0, 8);
		}

		return nextRecipes
			.sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0))
			.slice(0, 8);
	}, [featuredMode, filteredRecipes]);

	const handleClickFavorite = async (recipeId) => {
		if (!isAuthenticated) {
			navigate("/account");
			return;
		}

		if (pendingFavoriteIds.includes(recipeId)) return;

		const isFavorite = wishlist.some(
			(recipe) => Number(recipe.recipe_id) === Number(recipeId)
		);

		setPendingFavoriteIds((currentIds) => [...currentIds, recipeId]);

		try {
			if (isFavorite) {
				const response = await axios.delete(
					apiRoutes.userWishlistItem(userId, recipeId)
				);
				if (response.status === 200) {
					setWishlist((currentWishlist) =>
						currentWishlist.filter(
							(recipe) => Number(recipe.recipe_id) !== Number(recipeId)
						)
					);
					showToast({ title: "Removed from wishlist" });
				}
				return;
			}

			const response = await axios.post(apiRoutes.userWishlist(userId), {
				user_id: userId,
				recipe_id: recipeId,
			});
			if (response.status === 200) {
				setWishlist((currentWishlist) => [
					...currentWishlist,
					{ recipe_id: recipeId },
				]);
				showToast({ title: "Added to wishlist" });
			}
		} catch (err) {
			console.error(err);
		} finally {
			setPendingFavoriteIds((currentIds) =>
				currentIds.filter((currentId) => currentId !== recipeId)
			);
		}
	};
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setCategoryError(null);
				const response = await axios.get(apiRoutes.categories);
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
			if (!isAuthenticated || !userId) {
				setWishlist([]);
				return;
			}

			try {
				const response = await axios.get(apiRoutes.userWishlist(userId));
				if (response.status === 200) {
					setWishlist(getArrayPayload(response.data, "wishlist"));
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchWishlists();
	}, [isAuthenticated, userId]);
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
						<CategorySection
							categories={categories}
							selectedCategoryId={selectedCategoryId}
							onCategorySelect={setSelectedCategoryId}
						/>
					)}
					<FoodCardList
						recipes={featuredRecipes}
						wishlist={wishlist}
						onClickFavorite={handleClickFavorite}
						featuredMode={featuredMode}
						onFeaturedModeChange={setFeaturedMode}
					/>
				</>
			)}
		</div>
	);
};

export default HomeMain;
