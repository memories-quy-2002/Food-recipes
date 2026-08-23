import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import FavoriteRecipe from "@/features/wishlist/FavoriteRecipe";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { RecipeContext } from "@/app/RecipeProvider";
import { getSavedAtTimestamp } from "./savedRecipe";
import "./Wishlist.scss";

export const normalizeSavedRecipe = (item) => ({
	recipe: item?.recipe || item || {},
	savedAt:
		item?.savedAt ?? item?.saved_at ?? item?.dateAdded ?? item?.date_added ??
			item?.recipe?.savedAt ?? item?.recipe?.saved_at ?? null,
});

const compareRecipeNames = (a, b) =>
	(a.recipe.recipe_name || "").localeCompare(b.recipe.recipe_name || "") ||
	Number(a.recipe.recipe_id) - Number(b.recipe.recipe_id);

const compareUnavailableSavedDates = (a, b) =>
	Number(Boolean(a.savedAt)) - Number(Boolean(b.savedAt)) ||
		compareRecipeNames(a, b);

export const byRecentlySaved = (a, b) => {
	const difference = getSavedAtTimestamp(b.savedAt) - getSavedAtTimestamp(a.savedAt);
	return Number.isNaN(difference)
		? compareUnavailableSavedDates(a, b)
		: difference ||
				(getSavedAtTimestamp(a.savedAt) === Number.NEGATIVE_INFINITY
					? compareUnavailableSavedDates(a, b)
					: compareRecipeNames(a, b));
};

export const getSavedRecipeEntries = (recipes, wishlist) =>
	wishlist
		.map(normalizeSavedRecipe)
		.map(({ recipe: savedRecipe, savedAt }) => {
			const recipe = recipes.find(
				(candidate) =>
					Number(candidate.recipe_id) === Number(savedRecipe.recipe_id)
			);
			return recipe ? { recipe, savedAt } : null;
		})
		.filter(Boolean);

export const getVisibleSavedRecipes = (
	recipes,
	wishlist,
	searchTerm = "",
	sortBy = "recent"
) => {
	return getVisibleSavedEntries(recipes, wishlist, searchTerm, sortBy).map(
		({ recipe }) => recipe
	);
};

export const getVisibleSavedEntries = (
	recipes,
	wishlist,
	searchTerm = "",
	sortBy = "recent"
) => {
	const normalizedSearch = searchTerm.trim().toLowerCase();
	let nextRecipes = getSavedRecipeEntries(recipes, wishlist).filter(({ recipe }) =>
		(recipe.recipe_name || "").toLowerCase().includes(normalizedSearch)
	);

	if (sortBy === "recent") nextRecipes = [...nextRecipes].sort(byRecentlySaved);
	if (sortBy === "name") {
		nextRecipes = [...nextRecipes].sort(compareRecipeNames);
	}
	if (sortBy === "rating") {
		nextRecipes = [...nextRecipes].sort(
			(a, b) =>
				Number(b.recipe.overall_score || 0) -
				Number(a.recipe.overall_score || 0) || compareRecipeNames(a, b)
		);
	}

	return nextRecipes;
};

const Wishlist = () => {
	const [wishlist, setWishlist] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [removeError, setRemoveError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("recent");
	const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);
	const [wishlistError, setWishlistError] = useState(null);
	const confirmButtonRef = useRef(null);
	const triggeringButtonRef = useRef(null);
	const pendingRecipeIdRef = useRef(null);
	const isRemovingRef = useRef(false);
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
						"Unable to load your saved recipes."
				);
			} finally {
				setIsLoadingWishlist(false);
			}
		};
		fetchFavorites();
	}, [user_id]);

	const favoriteRecipes = useMemo(
		() => getSavedRecipeEntries(recipes, wishlist),
		[recipes, wishlist]
	);

	const visibleEntries = useMemo(
		() => getVisibleSavedEntries(recipes, wishlist, searchTerm, sortBy),
		[recipes, wishlist, searchTerm, sortBy]
	);

	const handleShowModal = (recipe_id, triggeringButton) => {
		pendingRecipeIdRef.current = recipe_id;
		triggeringButtonRef.current = triggeringButton;
		setShowModal(true);
		setRemoveError(null);
	};

	const closeModal = () => {
		if (isRemovingRef.current) return;
		setShowModal(false);
		setRemoveError(null);
	};

	useEffect(() => {
		if (!showModal) {
			triggeringButtonRef.current?.focus?.();
			triggeringButtonRef.current = null;
			return undefined;
		}

		confirmButtonRef.current?.focus?.();
		const handleEscape = (event) => {
			if (event.key === "Escape") closeModal();
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [showModal, isRemoving]);

	useEffect(() => {
		if (!showModal) return undefined;
		const appRoot = document.getElementById("root");
		if (!appRoot) return undefined;
		const wasInert = appRoot.hasAttribute("inert");
		appRoot.setAttribute("inert", "");
		return () => {
			if (!wasInert) appRoot.removeAttribute("inert");
		};
	}, [showModal]);

	const handleDelete = async () => {
		if (isRemovingRef.current) return;
		const capturedRecipeId = pendingRecipeIdRef.current;
		if (capturedRecipeId == null) return;
		isRemovingRef.current = true;
		setIsRemoving(true);
		setRemoveError(null);
		try {
			const response = await axios.delete(
				apiRoutes.userWishlistItem(user_id, capturedRecipeId)
			);
			if (response.status === 200) {
				setWishlist((currentWishlist) =>
					currentWishlist.filter(
						(item) =>
							Number(item.recipe?.recipe_id ?? item.recipe_id) !==
							Number(capturedRecipeId)
					)
				);
				setShowModal(false);
				pendingRecipeIdRef.current = null;
			}
		} catch (err) {
			console.error(err);
			setRemoveError(
				err.response?.data?.message ||
					"We could not remove this saved recipe. Please try again."
			);
		} finally {
			isRemovingRef.current = false;
			setIsRemoving(false);
		}
	};

	return (
		<Container fluid className="wishlist">
			<PageHelmet
				title="Saved Recipes"
				description="Review and organize the recipes you saved for later."
				path="/wishlist"
				noIndex
			/>
			<div className="wishlist__hero">
				<div>
					<span>Saved recipes</span>
					<h1>Saved Recipes</h1>
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
							<option value="rating">Highest rated</option>
							<option value="name">Name A-Z</option>
						</select>
					</label>
				</div>
				<div className="wishlist__main__content">
					{isLoadingRecipes || isLoadingWishlist ? (
						<PageState
							title="Loading saved recipes"
							message="Fetching your saved recipes."
						/>
					) : recipesError || wishlistError ? (
						<PageState
							type="error"
							title="Saved recipes could not load"
							message={recipesError || wishlistError}
							actionLabel="Try again"
							onAction={() => window.location.reload()}
						/>
							) : visibleEntries.length === 0 ? (
						<PageState
							type="empty"
							title={
								searchTerm
									? "No saved recipes match your search"
									: "No saved recipes yet"
							}
							message={
								searchTerm
									? "Clear the search or browse all recipes to find something to save."
									: "Find something to cook, then save it here for later."
							}
							actionLabel={searchTerm ? "Clear search" : "Find something to cook"}
							onAction={() =>
								searchTerm
									? setSearchTerm("")
									: navigate("/food")
							}
						/>
					) : (
						<ul className="wishlist__main__content__list">
							{visibleEntries.map(({ recipe, savedAt }) => (
								<FavoriteRecipe
									key={recipe.recipe_id}
									recipe={recipe}
									savedAt={savedAt}
									handleShowModal={(triggeringButton) =>
										handleShowModal(recipe.recipe_id, triggeringButton)
								}
								/>
							))}
						</ul>
					)}
				</div>
			</div>
			{showModal &&
				createPortal(
					<div className="wishlist__modal" role="presentation">
					<div
						className="wishlist__modal__content"
						role="dialog"
						aria-modal="true"
						aria-labelledby="remove-saved-recipe-title"
					>
						<h3 id="remove-saved-recipe-title">Remove saved recipe?</h3>
						<p>
							This recipe will be removed from your saved recipes. You
							can add it again later from the recipe page.
						</p>
						{removeError && <p role="alert">{removeError}</p>}
						<div className="wishlist__modal__buttons">
							<button
								className="wishlist__modal__button wishlist__modal__button--danger"
								type="button"
								ref={confirmButtonRef}
								onClick={handleDelete}
								disabled={isRemoving}
								aria-busy={isRemoving}
							>
								{isRemoving ? "Removing…" : "Remove"}
							</button>
							<button
								className="wishlist__modal__button"
								type="button"
								disabled={isRemoving}
								onClick={closeModal}
							>
								Cancel
							</button>
						</div>
					</div>
					</div>,
					document.body
				)}
		</Container>
	);
};

export default Wishlist;
