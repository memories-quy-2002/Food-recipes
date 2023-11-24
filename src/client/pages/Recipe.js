import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import RecipeContainerSummary from "../components/recipe/RecipeContainerSummary";
import RecipeContent from "../components/recipe/RecipeContent";
import "../styles/Recipe.scss";
import ErrorPage from "./ErrorPage";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const [favorite, setFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [review, setReview] = useState("");
	const [showReview, setShowReview] = useState(false);
	const [reviewList, setReviewList] = useState([]);
	const navigate = useNavigate();

	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const userId = isAuthenticated
		? local.isAuthenticated
			? local.user.user_id
			: session.user.user_id
		: 0;

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

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			await axios.post(`/rating/${userId}/${recipe.recipe_id}`, {
				score: ratingScore,
				review: review,
			});
			window.location.reload(false);
		} catch (err) {
			console.error(err);
		}
	};

	const handleClickFavorite = async (event) => {
		event.preventDefault();
		if (!isAuthenticated) navigate("/account");
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
			try {
				const response = await axios.get(`/wishlist/${userId}`);
				if (response.status === 200 && recipe !== null) {
					setFavorite(
						response.data.wishlist.some(
							(wishlistRecipe) =>
								wishlistRecipe.recipe_id === recipe.recipe_id
						)
					);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchFavorites();
	}, [recipe, userId]);
	useEffect(() => {
		const fetchRating = async () => {
			try {
				if (recipe !== null) {
					const response = await axios.get(`/rating/${userId}`);
					if (response.status === 200) {
						const myRecipeRating = response.data.ratings.filter(
							(rating) => rating.recipe_id === recipe.recipe_id
						);
						setRatingScore(myRecipeRating[0].score);
						setReview(myRecipeRating[0].review);
					}
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchRating();
	}, [recipe, userId]);
	useEffect(() => {
		const fetchReviews = async () => {
			try {
				if (recipe !== null) {
					const response = await axios.get(
						`/review/${recipe?.recipe_id}`
					);
					if (response.status === 200) {
						setReviewList(response.data.reviews);
					}
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchReviews();
	}, [recipe]);
	if (!id) {
		return <ErrorPage />;
	}
	return (
		<>
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
						isAuthenticated={isAuthenticated}
						onSubmit={handleSubmit}
						onStarClick={handleStarClick}
						onToggleReview={handleToggleReview}
						onReviewChange={handleReviewChange}
					/>
				</Container>
			)}
		</>
	);
};

export default Recipe;
