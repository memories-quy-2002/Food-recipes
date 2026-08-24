import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { apiRoutes, getUserRecipeRatingRoute } from "@/shared/api/routes";
import {
	isWishlistAddSuccess,
	serializeWishlistPayload,
} from "@/shared/api/mutations";
import RecipeContainerSummary from "@/features/recipes/RecipeContainerSummary";
import RecipeContent from "@/features/recipes/RecipeContent";
import RecipeOtherList from "@/features/recipes/RecipeOtherList";
import CookingMode from "@/features/recipes/cooking/CookingMode";
import { useAddRecipeIngredientsMutation } from "@/features/shopping/api/shoppingQueries";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { getArrayPayload } from "@/shared/api/payload";
import ErrorPage from "@/features/content/ErrorPage";
import {
	beginAuthIntent,
	isMatchingSaveRecipeIntent,
} from "@/features/auth/returnIntent";
import "./Recipe.scss";

const Recipe = () => {
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const [recipe, setRecipe] = useState(null);
	const [isLoadingRecipe, setIsLoadingRecipe] = useState(true);
	const [recipeError, setRecipeError] = useState(null);
	const [favorite, setFavorite] = useState(false);
	const [favoriteLoadedKey, setFavoriteLoadedKey] = useState(null);
	const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [hasExistingRating, setHasExistingRating] = useState(false);
	const [review, setReview] = useState("");
	const [showReview, setShowReview] = useState(false);
	const [reviewList, setReviewList] = useState([]);
	const [isLoadingReviews, setIsLoadingReviews] = useState(false);
	const [reviewsError, setReviewsError] = useState(null);
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);
	const [isDeletingReview, setIsDeletingReview] = useState(false);
	const [reviewMessage, setReviewMessage] = useState(null);
	const { showToast } = useToast();
	const navigate = useNavigate();
	const addIngredientsMutation = useAddRecipeIngredientsMutation();
	const canDeleteReview = true;
	const canMutateReview = true;

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");
	const isCookingMode = location.pathname === "/recipe/cooking";
	const planningDate = searchParams.get("date");
	const planningSlot = searchParams.get("slot");
	const planningServings = Number(searchParams.get("servings"));
	const planningItemId = searchParams.get("planItemId");
	const requestedReturnTo = searchParams.get("returnTo");
	const safeReturnTo =
		requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
			? requestedReturnTo
			: "/planning";
	const planningContext =
		planningItemId &&
		planningDate &&
		planningSlot &&
		Number.isInteger(planningServings) &&
		planningServings > 0
			? {
					date: planningDate,
					slot: planningSlot,
					servings: Math.min(planningServings, 24),
					returnTo: safeReturnTo,
			  }
			: null;
	const currentPath = `${location.pathname}${location.search}${location.hash}`;
	const processedAuthIntent = useRef(null);
	const favoriteLoadKey =
		isAuthenticated
			? userId && recipe
				? `user:${userId}:recipe:${recipe.recipe_id}`
				: "authenticated-pending"
			: "guest";
	const isFavoriteLoaded = favoriteLoadedKey === favoriteLoadKey;

	const fetchRecipe = useCallback(async ({ showLoading = true } = {}) => {
		if (!id) return;

		try {
			if (showLoading) setIsLoadingRecipe(true);
			setRecipeError(null);
			const response = await axios.get(apiRoutes.recipe(id));
			if (response.status === 200) {
				setRecipe(response.data.recipe);
			}
		} catch (err) {
			console.error(err);
			setRecipeError(
				err.response?.data?.message || "Unable to load this recipe."
			);
		} finally {
			if (showLoading) setIsLoadingRecipe(false);
		}
	}, [id]);

	const handleStarClick = (clickedRating) => {
		setRatingScore(clickedRating);
	};

	const handleToggleReview = () => {
		setShowReview((showReview) => !showReview);
	};

	const handleReviewChange = (event) => {
		setReview(event.target.value.slice(0, 500));
	};

	const fetchReviews = useCallback(async (recipeId) => {
		if (!recipeId) return;

		try {
			setIsLoadingReviews(true);
			setReviewsError(null);
			const response = await axios.get(apiRoutes.recipeReviews(recipeId));
			if (response.status === 200) {
				setReviewList(getArrayPayload(response.data, "reviews"));
			}
		} catch (err) {
			console.error(err);
			setReviewsError(
				err.response?.data?.message || "Unable to load reviews."
			);
		} finally {
			setIsLoadingReviews(false);
		}
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!isAuthenticated) {
			navigate("/account");
			return;
		}

		if (!recipe || !canMutateReview) return;

		if (!ratingScore) {
			setReviewMessage({
				type: "error",
				text: "Choose a star rating before submitting your review.",
			});
			return;
		}

		setIsSubmittingReview(true);
		setReviewMessage(null);

		try {
			await axios.put(
				getUserRecipeRatingRoute(recipe.recipe_id),
				{
					score: ratingScore,
					review: review.trim(),
				}
			);
			setHasExistingRating(true);
			await fetchRecipe({ showLoading: false });
			await fetchReviews(recipe.recipe_id);
			setReviewMessage({
				type: "success",
				text: hasExistingRating
					? "Your review has been updated."
					: "Your rating and review have been saved.",
			});
		} catch (err) {
			console.error(err);
			setReviewMessage({
				type: "error",
				text: "We could not save your review. Please try again.",
			});
		} finally {
			setIsSubmittingReview(false);
		}
	};

	const handleDeleteReview = async () => {
		if (
			!isAuthenticated ||
			!recipe ||
			!hasExistingRating ||
			!canMutateReview ||
			!canDeleteReview
		) {
			return;
		}

		setIsDeletingReview(true);
		setReviewMessage(null);
		try {
			await axios.delete(
				apiRoutes.userRecipeRatingDelete(recipe.recipe_id)
			);
			setRatingScore(0);
			setReview("");
			setShowReview(false);
			setHasExistingRating(false);
			await fetchRecipe({ showLoading: false });
			await fetchReviews(recipe.recipe_id);
			setReviewMessage({
				type: "success",
				text: "Your review has been deleted.",
			});
		} catch (err) {
			console.error(err);
			setReviewMessage({
				type: "error",
				text: "We could not delete your review. Please try again.",
			});
		} finally {
			setIsDeletingReview(false);
		}
	};

	const handleClickFavorite = async (event) => {
		event?.preventDefault();
		if (!isAuthenticated) {
			beginAuthIntent({
				returnTo: currentPath,
				action: "saveRecipe",
				recipeId: recipe?.recipe_id,
			});
			navigate("/account?signup=false", {
				state: { from: currentPath },
			});
			return;
		}
		if (!recipe || isUpdatingFavorite) return;

		try {
			setIsUpdatingFavorite(true);
			if (favorite) {
				const response = await axios.delete(
					apiRoutes.userWishlistItem(recipe.recipe_id)
				);
				if (response.status === 200) {
					setFavorite(false);
					showToast({ title: "Removed from Saved" });
				}
			} else {
				const response = await axios.post(
					apiRoutes.userWishlist,
					serializeWishlistPayload(recipe.recipe_id)
				);
				if (isWishlistAddSuccess(response.status)) {
					setFavorite(true);
					showToast({ title: "Saved recipe" });
				}
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsUpdatingFavorite(false);
		}
	};

	const handleAddIngredientsToShoppingList = () => {
		if (!isAuthenticated) {
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		if (!recipe || addIngredientsMutation.isPending) return;

		addIngredientsMutation.mutate(recipe.recipe_id, {
			onSuccess: (response) => {
				const count = response?.items?.length ?? 0;
				showToast({
					title: `${count} ingredient${count === 1 ? "" : "s"} added to Shopping List`,
				});
			},
			onError: () => {
				showToast({
					title: "We could not add those ingredients. Try again.",
					type: "error",
				});
			},
		});
	};
	useEffect(() => {
		const intent = location.state?.pendingAuthIntent;
		if (
			!isAuthenticated ||
			!recipe ||
			!isFavoriteLoaded ||
			!isMatchingSaveRecipeIntent(intent, currentPath, recipe.recipe_id) ||
			processedAuthIntent.current === intent
		) {
			return;
		}

		processedAuthIntent.current = intent;
		navigate(currentPath, { replace: true, state: null });
		if (!favorite) handleClickFavorite();
	}, [currentPath, favorite, handleClickFavorite, isAuthenticated, isFavoriteLoaded, location.state, navigate, recipe]);
	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	useEffect(() => {
		const fetchFavorites = async () => {
			setFavoriteLoadedKey(null);
			if (!isAuthenticated || !userId || !recipe) {
				setFavorite(false);
				setFavoriteLoadedKey(isAuthenticated ? "authenticated-pending" : "guest");
				return;
			}

			try {
				const response = await axios.get(apiRoutes.userWishlist);
				if (response.status === 200) {
					setFavorite(
						getArrayPayload(response.data, "wishlist").some(
							(wishlistRecipe) =>
								Number(
									wishlistRecipe.recipe?.recipe_id ??
										wishlistRecipe.recipe_id
								) ===
								Number(recipe.recipe_id)
						)
					);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setFavoriteLoadedKey(`user:${userId}:recipe:${recipe.recipe_id}`);
			}
		};
		fetchFavorites();
	}, [isAuthenticated, recipe, userId]);
	useEffect(() => {
		const fetchRating = async () => {
			if (!isAuthenticated || !recipe) {
				setRatingScore(0);
				setHasExistingRating(false);
				setReview("");
				return;
			}

			try {
				const response = await axios.get(apiRoutes.userRatings);
				if (response.status === 200) {
					const myRecipeRating = getArrayPayload(
						response.data,
						"ratings"
					).find(
						(rating) =>
							Number(rating.recipe_id) === Number(recipe.recipe_id)
					);

					setRatingScore(Number(myRecipeRating?.score || 0));
					setHasExistingRating(Boolean(myRecipeRating));
					setReview(myRecipeRating?.review || "");
					setShowReview(Boolean(myRecipeRating?.review));
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchRating();
	}, [isAuthenticated, recipe, userId]);
	useEffect(() => {
		if (!recipe) return;

		fetchReviews(recipe.recipe_id).catch((err) => console.error(err));
	}, [fetchReviews, recipe]);
	if (!id) {
		return <ErrorPage />;
	}
	return (
		<>
			<PageHelmet
				title={recipe?.recipe_name || "Recipe"}
				description={
					recipe?.recipe_description ||
					"Read recipe details, cooking time, ratings, and community reviews."
				}
				path={`/recipe?id=${id}`}
				type="article"
			/>
			{isLoadingRecipe ? (
				<PageState
					title="Loading recipe"
					message="Fetching recipe details, ratings, and reviews."
				/>
			) : recipeError ? (
				<PageState
					type="error"
					title="Recipe could not load"
					message={recipeError}
					actionLabel="Back to recipes"
					onAction={() => navigate("/food")}
				/>
			) : recipe && isCookingMode ? (
				<CookingMode
					recipe={recipe}
					planningContext={planningContext || undefined}
					onBackToPlan={
						planningContext
							? () => navigate(planningContext.returnTo || "/planning")
							: undefined
					}
					onExit={() => navigate(`/recipe?id=${encodeURIComponent(id)}`)}
				/>
			) : recipe && (
				<Container fluid className="fr-recipe" style={{ padding: 0 }}>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={favorite}
						onClickFavorite={handleClickFavorite}
						onAddIngredients={handleAddIngredientsToShoppingList}
						isAddingIngredients={addIngredientsMutation.isPending}
					/>
					<RecipeContent
						recipe={recipe}
						ratingScore={ratingScore}
						review={review}
						showReview={showReview}
						reviewList={reviewList}
						reviewMessage={reviewMessage}
						hasExistingRating={hasExistingRating}
						isRecipeAuthor={
							Number(recipe.user_id) === Number(userId) &&
							isAuthenticated
						}
						canDeleteReview={canDeleteReview}
						canMutateReview={canMutateReview}
						isLoadingReviews={isLoadingReviews}
						reviewsError={reviewsError}
						isAuthenticated={isAuthenticated}
						isSubmittingReview={isSubmittingReview}
						isDeletingReview={isDeletingReview}
						onSubmit={handleSubmit}
						onDelete={handleDeleteReview}
						onStarClick={handleStarClick}
						onToggleReview={handleToggleReview}
						onReviewChange={handleReviewChange}
					/>
					<RecipeOtherList recipeId={recipe.recipe_id} />
				</Container>
			)}
		</>
	);
};

export default Recipe;
