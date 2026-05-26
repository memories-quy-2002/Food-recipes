import React, { useContext, useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import FavoriteRecipe from "@/features/wishlist/FavoriteRecipe";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { RecipeContext } from "@/app/RecipeProvider";
import "./Wishlist.scss";

const Wishlist = () => {
	const [wishlist, setWishlist] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [recipeId, setRecipeId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("recent");
	const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);
	const [wishlistError, setWishlistError] = useState(null);
	const navigate = useNavigate();
	const { recipes, isLoadingRecipes, recipesError } = useContext(RecipeContext);
	const { local, session } = useSelector(({ auth }) => auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user_id = isAuthenticated
		? local.isAuthenticated
			? local.user.user_id
			: session.user.user_id
		: 0;

	useEffect(() => {
		const fetchFavorites = async () => {
			if (!user_id) {
				setIsLoadingWishlist(false);
				return;
			}

			try {
				setIsLoadingWishlist(true);
				setWishlistError(null);
				const response = await axios.get(apiRoutes.userWishlist(user_id));
				setWishlist(getArrayPayload(response.data, "wishlist"));
			} catch (err) {
				console.error(err);
				setWishlistError(
					err.response?.data?.message ||
					"Unable to load your wishlist."
				);
			} finally {
				setIsLoadingWishlist(false);
			}
		};
		fetchFavorites();
	}, [user_id]);

	const favoriteRecipes = useMemo(
		() =>
			recipes.filter((recipe) =>
				wishlist.some(
					(wishlistRecipe) =>
						wishlistRecipe.recipe_id === recipe.recipe_id
				)
			),
		[recipes, wishlist]
	);

	const visibleRecipes = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		let nextRecipes = favoriteRecipes.filter((recipe) =>
			recipe.recipe_name.toLowerCase().includes(normalizedSearch)
		);

		if (sortBy === "name") {
			nextRecipes = [...nextRecipes].sort((a, b) =>
				a.recipe_name.localeCompare(b.recipe_name)
			);
		}

		if (sortBy === "rating") {
			nextRecipes = [...nextRecipes].sort(
				(a, b) =>
					Number(b.overall_score || 0) -
					Number(a.overall_score || 0)
			);
		}

		return nextRecipes;
	}, [favoriteRecipes, searchTerm, sortBy]);

	const handleShowModal = (recipe_id) => {
		setShowModal(true);
		setRecipeId(recipe_id);
	};

	const handleDelete = async () => {
		try {
			const response = await axios.delete(
				apiRoutes.userWishlistItem(user_id, recipeId)
			);
			if (response.status === 200) {
				setWishlist((currentWishlist) =>
					currentWishlist.filter(
						(recipe) => recipe.recipe_id !== recipeId
					)
				);
				setShowModal(false);
				setRecipeId(null);
			}
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<Container fluid className="wishlist">
			<PageHelmet
				title="Wishlist"
				description="Review and organize your saved Food Recipes favorites."
				path="/wishlist"
				noIndex
			/>
			<div className="wishlist__hero">
				<div>
					<span>Saved recipes</span>
					<h1>Your favorite recipes</h1>
					<p>
						Keep your go-to dishes close, search your saved list, and
						open recipes when you are ready to cook.
					</p>
				</div>
				<section className="wishlist__summary">
					<div>
						<strong>{favoriteRecipes.length}</strong>
						<span>Saved</span>
					</div>
					<div>
						<strong>{recipes.length}</strong>
						<span>All recipes</span>
					</div>
					<div>
						<strong>{isAuthenticated ? "Active" : "Guest"}</strong>
						<span>Account</span>
					</div>
				</section>
			</div>
			<div className="wishlist__main">
				<div className="wishlist__toolbar">
					<label>
						Search
						<input
							type="text"
							placeholder="Search saved recipes..."
							value={searchTerm}
							onChange={(event) =>
								setSearchTerm(event.target.value)
							}
						/>
					</label>
					<label>
						Sort
						<select
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value)}
						>
							<option value="recent">Recently saved</option>
							<option value="rating">Highest score</option>
							<option value="name">Name A-Z</option>
						</select>
					</label>
				</div>
				<div className="wishlist__main__content">
					{isLoadingRecipes || isLoadingWishlist ? (
						<PageState
							title="Loading wishlist"
							message="Fetching your saved recipes."
						/>
					) : recipesError || wishlistError ? (
						<PageState
							type="error"
							title="Wishlist could not load"
							message={recipesError || wishlistError}
							actionLabel="Try again"
							onAction={() => window.location.reload()}
						/>
					) : visibleRecipes.length === 0 ? (
						<PageState
							type="empty"
							title={
								searchTerm
									? "No saved recipes match your search"
									: "Your wishlist is empty"
							}
							message={
								searchTerm
									? "Clear the search or browse all recipes to find something to save."
									: "Browse recipes and tap the heart button to build your saved list."
							}
							actionLabel={searchTerm ? "Clear search" : "Browse recipes"}
							onAction={() =>
								searchTerm
									? setSearchTerm("")
									: navigate("/food")
							}
						/>
					) : (
						<ul className="wishlist__main__content__list">
							{visibleRecipes.map((recipe) => (
								<FavoriteRecipe
									key={recipe.recipe_id}
									recipe={recipe}
									handleShowModal={() =>
										handleShowModal(recipe.recipe_id)
									}
								/>
							))}
						</ul>
					)}
				</div>
			</div>
			{showModal && (
				<div className="wishlist__modal" role="presentation">
					<div className="wishlist__modal__content" role="dialog">
						<h3>Remove saved recipe</h3>
						<p>
							This recipe will be removed from your wishlist. You
							can add it again later from the recipe page.
						</p>
						<div className="wishlist__modal__buttons">
							<button
								className="wishlist__modal__button wishlist__modal__button--danger"
								type="submit"
								onClick={handleDelete}
							>
								Remove
							</button>
							<button
								className="wishlist__modal__button"
								type="button"
								onClick={() => setShowModal(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</Container>
	);
};

export default Wishlist;
