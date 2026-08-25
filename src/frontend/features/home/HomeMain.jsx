import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import {
	isWishlistAddSuccess,
	serializeWishlistPayload,
} from "@/shared/api/mutations";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import { useToast } from "@/app/ToastProvider";
import CategorySection from "./main/CategorySection";
import FoodCardList from "./main/FoodCardList";
import HomeSearchBar from "./main/HomeSearchBar";
import { useHomeSearchQuery } from "./main/api/useHomeSearchQuery";
import PageState from "@/shared/ui/PageState";
import RecentlyViewedRecipes from "@/features/recipes/RecentlyViewedRecipes";
import PantryMatchPanel from "./main/PantryMatchPanel";
import PersonalizedHomeFeed from "./PersonalizedHomeFeed";
import {
	beginAuthIntent,
	isMatchingSaveRecipeIntent,
} from "@/features/auth/returnIntent";

const normalizeMinutes = (value) => {
	const minutes = Number(value);
	return Number.isFinite(minutes) ? minutes : null;
};

const HOME_RECIPE_LIMIT = 4;

export const normalizeRecipeSummary = (recipe) => {
	const prepTimeMinutes = normalizeMinutes(recipe.prepTimeMinutes ?? recipe.prep_time_minutes);
	const cookTimeMinutes = normalizeMinutes(recipe.cookTimeMinutes ?? recipe.cook_time_minutes);

	return {
		...recipe,
		prepTimeMinutes,
		cookTimeMinutes,
		totalTimeMinutes:
			prepTimeMinutes === null || cookTimeMinutes === null
				? Number.MAX_SAFE_INTEGER
				: prepTimeMinutes + cookTimeMinutes,
	};
};

export const byQuickest = (a, b) => a.totalTimeMinutes - b.totalTimeMinutes;

export const getQuickMeals = (recipes) =>
	recipes.map(normalizeRecipeSummary).sort(byQuickest).slice(0, HOME_RECIPE_LIMIT);

const HomeMain = () => {
	const [categories, setCategories] = useState([]);
	const [wishlist, setWishlist] = useState([]);
	const [wishlistLoadedKey, setWishlistLoadedKey] = useState(null);
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState("all");
	const [featuredMode, setFeaturedMode] = useState("top-rated");
	const [categoryError, setCategoryError] = useState(null);
	const { recipes, isLoadingRecipes, recipesError } = useContext(RecipeContext);
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const { showToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const searchTerm = new URLSearchParams(location.search).get("q") || "";
	const searchQuery = useHomeSearchQuery(searchTerm);
	const processedAuthIntent = useRef(null);
	const currentPath = `${location.pathname}${location.search}${location.hash}`;
	const wishlistLoadKey = isAuthenticated
		? userId
			? `user:${userId}`
			: "authenticated-pending"
		: "guest";
	const isWishlistLoaded = wishlistLoadedKey === wishlistLoadKey;

	const filteredRecipes = useMemo(() => {
		if (selectedCategoryId === "all") return recipes;
		return recipes.filter(
			(recipe) => Number(recipe.category_id) === Number(selectedCategoryId)
		);
	}, [recipes, selectedCategoryId]);

	const featuredRecipes = useMemo(() => {
		const nextRecipes = [...filteredRecipes];

		if (featuredMode === "quick-meals") return getQuickMeals(nextRecipes);
		if (featuredMode === "most-reviewed") {
			return nextRecipes
				.sort((a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0))
				.slice(0, HOME_RECIPE_LIMIT);
		}

		return nextRecipes
			.sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0))
			.slice(0, HOME_RECIPE_LIMIT);
	}, [featuredMode, filteredRecipes]);

	const handleClickFavorite = async (recipeId) => {
		if (!isAuthenticated) {
			beginAuthIntent({ returnTo: currentPath, action: "saveRecipe", recipeId });
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		if (pendingFavoriteIds.includes(recipeId)) return;

		const isFavorite = wishlist.some(
			(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) === Number(recipeId)
		);
		setPendingFavoriteIds((currentIds) => [...currentIds, recipeId]);

		try {
			if (isFavorite) {
				const response = await axios.delete(apiRoutes.userWishlistItem(recipeId));
				if (response.status === 200) {
					setWishlist((currentWishlist) =>
						currentWishlist.filter(
							(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) !== Number(recipeId)
						)
					);
					showToast({ title: "Removed from Saved" });
				}
				return;
			}

			const response = await axios.post(
				apiRoutes.userWishlist,
				serializeWishlistPayload(recipeId)
			);
			if (isWishlistAddSuccess(response.status)) {
				setWishlist((currentWishlist) => [...currentWishlist, { recipe_id: recipeId }]);
				showToast({ title: "Saved recipe" });
			}
		} catch (err) {
			console.error(err);
			showToast({
				title: "Couldn’t update Saved",
				message: "Please try again in a moment.",
				type: "error",
			});
		} finally {
			setPendingFavoriteIds((currentIds) =>
				currentIds.filter((currentId) => currentId !== recipeId)
			);
		}
	};

	useEffect(() => {
		const intent = location.state?.pendingAuthIntent;
		if (
			!isAuthenticated ||
			!isWishlistLoaded ||
			!isMatchingSaveRecipeIntent(intent, currentPath, intent?.recipeId) ||
			!recipes.some((recipe) => Number(recipe.recipe_id) === Number(intent.recipeId)) ||
			processedAuthIntent.current === intent
		) return;

		processedAuthIntent.current = intent;
		navigate(currentPath, { replace: true, state: null });
		const isFavorite = wishlist.some(
			(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) === Number(intent.recipeId)
		);
		if (!isFavorite) handleClickFavorite(Number(intent.recipeId));
	}, [currentPath, handleClickFavorite, isAuthenticated, isWishlistLoaded, location.state, navigate, recipes, wishlist]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setCategoryError(null);
				const response = await axios.get(apiRoutes.categories);
				setCategories(getArrayPayload(response.data, "categories"));
			} catch (err) {
				console.error(err);
				setCategoryError(err.response?.data?.message || "Unable to load recipe categories.");
			}
		};
		fetchCategories();
	}, [userId]);

	useEffect(() => {
		const fetchWishlists = async () => {
			setWishlistLoadedKey(null);
			if (!isAuthenticated || !userId) {
				setWishlist([]);
				setWishlistLoadedKey(isAuthenticated ? "authenticated-pending" : "guest");
				return;
			}

			try {
				const response = await axios.get(apiRoutes.userWishlist);
				if (response.status === 200) setWishlist(getArrayPayload(response.data, "wishlist"));
			} catch (err) {
				console.error(err);
			} finally {
				setWishlistLoadedKey(`user:${userId}`);
			}
		};
		fetchWishlists();
	}, [isAuthenticated, userId]);

	return (
		<div className="mx-auto w-full max-w-[112rem] space-y-8 px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:space-y-10 lg:px-10 lg:pb-8">
			{isLoadingRecipes ? (
				<PageState title="Loading recipes" message="Fetching recipes for search and featured cards." />
			) : recipesError ? (
				<PageState type="error" title="Recipes could not load" message={recipesError} />
			) : (
				<>
					<PersonalizedHomeFeed
						isAuthenticated={isAuthenticated}
						wishlist={wishlist}
						onClickFavorite={handleClickFavorite}
					/>
					<PantryMatchPanel />
					<HomeSearchBar
						recipes={recipes}
						searchResults={searchQuery.data?.recipes ?? []}
						isSearchLoading={searchQuery.isFetching}
						searchError={searchQuery.error}
					/>
					{categoryError ? (
						<PageState type="error" title="Categories could not load" message={categoryError} />
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
					<RecentlyViewedRecipes recipes={recipes} />
				</>
			)}
		</div>
	);
};

export default HomeMain;
