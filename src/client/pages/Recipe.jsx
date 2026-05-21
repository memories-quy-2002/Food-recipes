import React, { useCallback, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import RecipeContainerSummary from "../components/recipe/RecipeContainerSummary";
import RecipeContent from "../components/recipe/RecipeContent";
import RecipeOtherList from "../components/recipe/RecipeOtherList";
import PageHelmet from "../components/seo/PageHelmet";
import { AuthContext } from "../context/AuthProvider";
import "../styles/Recipe.scss";
import ErrorPage from "./ErrorPage";

const Recipe = () => {
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const [recipe, setRecipe] = useState(null);
	const [favorite, setFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [review, setReview] = useState("");
	const [showReview, setShowReview] = useState(false);
	const [reviewList, setReviewList] = useState([]);
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);
	const [reviewMessage, setReviewMessage] = useState(null);
	const navigate = useNavigate();

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");

	const handleStarClick = (clickedRating) => {
		setRatingScore(clickedRating);
	};

	const handleToggleReview = () => {
		setShowReview((showReview) => !showReview);
	};

	const handleReviewChange = (event) => {
		setReview(event.target.value);
	};

	const fetchReviews = useCallback(async (recipeId) => {
		if (!recipeId) return;

		const response = await axios.get(`/review/${recipeId}`);
		if (response.status === 200) {
			setReviewList(response.data.reviews || []);
		}
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!isAuthenticated) {
			navigate("/account");
			return;
		}

		if (!recipe) return;

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
			await axios.post(`/rating/${userId}/${recipe.recipe_id}`, {
				score: ratingScore,
				review,
			});
			await fetchReviews(recipe.recipe_id);
			setReviewMessage({
				type: "success",
				text: "Your rating and review have been saved.",
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

	const handleClickFavorite = async (event) => {
		event.preventDefault();
		if (!isAuthenticated) {
			navigate("/account");
			return;
		}
		if (!recipe) return;

		try {
			if (favorite) {
				const response = await axios.delete(
					`/wishlist/${userId}/${recipe.recipe_id}`
				);
				if (response.status === 200) {
					window.location.reload(false);
				}
			} else {
				await axios.post("/wishlist", {
					user_id: userId,
					recipe_id: recipe.recipe_id,
				});
				window.location.reload(false);
			}
		} catch (err) {
			console.error(err);
		}
	};
	useEffect(() => {
		const fetchRecipe = async () => {
			try {
				const response = await axios.get(`/recipe/${id}`);
				if (response.status === 200) {
					setRecipe(response.data.recipe);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchRecipe();
	}, [id]);

	useEffect(() => {
		const fetchFavorites = async () => {
			if (!isAuthenticated || !recipe) {
				setFavorite(false);
				return;
			}

			try {
				const response = await axios.get(`/wishlist/${userId}`);
				if (response.status === 200) {
					setFavorite(
						response.data.wishlist.some(
							(wishlistRecipe) =>
								Number(wishlistRecipe.recipe_id) ===
								Number(recipe.recipe_id)
						)
					);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchFavorites();
	}, [isAuthenticated, recipe, userId]);
	useEffect(() => {
		const fetchRating = async () => {
			if (!isAuthenticated || !recipe) {
				setRatingScore(0);
				setReview("");
				return;
			}

			try {
				const response = await axios.get(`/rating/${userId}`);
				if (response.status === 200) {
					const myRecipeRating = (response.data.ratings || []).find(
						(rating) =>
							Number(rating.recipe_id) === Number(recipe.recipe_id)
					);

					setRatingScore(Number(myRecipeRating?.score || 0));
					setReview(myRecipeRating?.review || "");
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
			{recipe && (
				<Container fluid style={{ padding: 0 }}>
					<RecipeContainerSummary
						recipe={recipe}
						favorite={favorite}
						onClickFavorite={handleClickFavorite}
					/>
					<RecipeContent
						recipe={recipe}
						ratingScore={ratingScore}
						review={review}
						showReview={showReview}
						reviewList={reviewList}
						reviewMessage={reviewMessage}
						isAuthenticated={isAuthenticated}
						isSubmittingReview={isSubmittingReview}
						onSubmit={handleSubmit}
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
