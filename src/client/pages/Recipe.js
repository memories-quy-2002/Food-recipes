import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { BsFillHeartFill, BsHeart, BsStar, BsStarFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import additionTime from "../utils/additionTime";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";
import ratingStar from "../utils/ratingStar";
import formatTimestamp from "../utils/formatTimestamp";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const [favorite, setFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [review, setReview] = useState("");
	const [showReview, setShowReview] = useState(false);
	const [reviewList, setReviewList] = useState([]);
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");
	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user_id = isAuthenticated
		? local.isAuthenticated
			? local.user.user_id
			: session.user.user_id
		: 0;

	const handleStarClick = (clickedRating) => {
		setRatingScore(clickedRating);
	};

	const handleShowReview = () => {
		setShowReview((showReview) => !showReview);
	};

	const handleReviewChange = (event) => {
		setReview(event.target.value);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		await axios.post(`/rating/${user_id}/${recipe.recipe_id}`, {
			score: ratingScore,
			review: review,
		});
		window.location.reload(false);
	};

	const handleClickFavorite = async (event) => {
		event.preventDefault();
		if (!isAuthenticated) navigate("/account");
		try {
			if (favorite) {
				const response = await axios.delete(
					`/wishlist/${user_id}/${recipe.recipe_id}`
				);
				if (response.status === 200) {
					window.location.reload(false);
				}
			} else {
				await axios.post("/wishlist", {
					user_id: user_id,
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
			const response = await axios.get(`/recipe/${id}`);
			if (response.status === 200) {
				setRecipe(response.data.recipe);
			}
		};
		fetchRecipe();
	}, [id]);

	useEffect(() => {
		const fetchFavorites = async () => {
			const response = await axios.get(`/wishlist/${user_id}`);
			if (response.status === 200 && recipe !== null) {
				setFavorite(
					response.data.wishlist.some(
						(wishlistRecipe) =>
							wishlistRecipe.recipe_id === recipe.recipe_id
					)
				);
			}
		};
		fetchFavorites();
	}, [recipe, user_id]);
	useEffect(() => {
		const fetchRating = async () => {
			try {
				if (recipe !== null) {
					const response = await axios.get(`/rating/${user_id}`);
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
	}, [recipe, user_id]);
	useEffect(() => {
		const fetchReviews = async () => {
			try {
				if (recipe !== null) {
					const response = await axios.get(
						`/review/${recipe.recipe_id}`
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
	return (
		<>
			{recipe != null && (
				<Container fluid style={{ padding: 0 }}>
					<Row className="recipe__container">
						<Col md={6}>
							<div className="recipe__container__summary">
								<div className="recipe__container__summary__title">
									<h1>{recipe.recipe_name}</h1>
								</div>

								<div className="recipe__container__summary__author">
									<p>By Food Recipes</p>
								</div>
								<div className="recipe__container__summary__date">
									<p>{formatTimestamp(recipe.date_added)}</p>
								</div>
								<div className="recipe__container__summary__fav">
									<button
										type="button"
										onClick={handleClickFavorite}
									>
										{favorite ? (
											<BsFillHeartFill
												size={24}
												color="white"
											/>
										) : (
											<BsHeart size={24} color="white" />
										)}

										<strong
											style={{
												color: "white",
												fontSize: "1.1rem",
											}}
										>
											{favorite
												? "Remove from favorite"
												: "Add to favorite"}
										</strong>
									</button>
								</div>
								<div className="recipe__container__summary__review">
									<div className="recipe__container__summary__review__score">
										<strong>{recipe.overall_score}</strong>
									</div>
									<div className="recipe__container__summary__review__stars">
										{ratingStar(
											recipe.overall_score,
											""
										).map((star) => star)}
									</div>
									<div className="recipe__container__summary__review__count">
										<strong>({recipe.num_ratings})</strong>
									</div>
								</div>
							</div>
						</Col>
						<Col md={6}>
							{convertImage(
								recipe.recipe_name,
								"recipe__container__img"
							)}
						</Col>
					</Row>
					<Row className="recipe__content">
						<Row className="recipe__content__time">
							<Col md={4}>
								<h5>Cook time</h5>
								<p>{convertTime(recipe.cook_time)}</p>
							</Col>
							<Col md={4}>
								<h5>Preparation time</h5>
								<p>{convertTime(recipe.prep_time)}</p>
							</Col>
							<Col md={4}>
								<h5>Total time</h5>
								<p>
									{additionTime(
										recipe.prep_time,
										recipe.cook_time
									)}
								</p>
							</Col>
						</Row>
						<Row className="recipe__content__desc">
							<div>
								<p>
									{recipe.recipe_description
										? recipe.recipe_description
										: "There is no description for this recipe"}
								</p>
							</div>
						</Row>
						{!isAuthenticated ? (
							<Row className="recipe__content__rating">
								<div className="recipe__content__rating__signin">
									<strong>
										<span>
											<a href="/account">Sign in</a>
										</span>{" "}
										to leave a Rating and Review
									</strong>
								</div>
							</Row>
						) : (
							<Row className="recipe__content__rating">
								<Form onSubmit={handleSubmit}>
									<Form.Group controlId="formBasicRating">
										<Form.Label className="fw-bold fs-5 my-3">
											Rating the recipe
										</Form.Label>
										<div className="recipe__content__rating__star">
											{[1, 2, 3, 4, 5].map((star) => (
												<span
													key={star}
													onClick={() =>
														handleStarClick(star)
													}
													style={{
														cursor: "pointer",
													}}
												>
													{star <= ratingScore ? (
														<BsStarFill
															size={24}
															color="orange"
														/>
													) : (
														<BsStar
															size={24}
															color="orange"
														/>
													)}
												</span>
											))}
											<span
												style={{
													fontWeight: "bold",
													fontSize: "20px",
													marginLeft: "0.5rem",
												}}
											>
												({parseInt(ratingScore)})
											</span>
										</div>
									</Form.Group>

									<div className="recipe__content__rating__review">
										<p
											style={{ color: "orange" }}
											className="recipe__content__rating__review__show"
											onClick={handleShowReview}
										>
											{showReview
												? "Hide your review"
												: "Show your review"}
										</p>
										{showReview && (
											<Form.Group controlId="formBasicReview">
												<Form.Label className="fw-bold fs-5 my-2">
													Review
												</Form.Label>
												<Form.Control
													as="textarea"
													rows={3}
													placeholder="Enter your review"
													value={review}
													onChange={
														handleReviewChange
													}
													className="border border-1 border-warning mb-3 recipe__content__rating__review__area"
												/>
											</Form.Group>
										)}
									</div>
									<Form.Group
										controlId="formBasicSubmit"
										className="recipe__content__rating__submit"
									>
										<Button variant="primary" type="submit">
											Submit
										</Button>
									</Form.Group>
								</Form>
							</Row>
						)}
						<Row className="recipe__content__reviews">
							<h3>All reviews ({reviewList.length})</h3>
							<ul className="recipe__content__reviews__list">
								{reviewList.map((review) => (
									<li
										key={review.rating_id}
										className="recipe__content__reviews__list__item"
									>
										<div className="recipe__content__reviews__list__item__container">
											<div className="recipe__content__reviews__list__item__container__context">
												<div>
													{convertImage(
														"avatar",
														"recipe__content__reviews__list__item__container__context__img"
													)}
													<strong>
														{review.full_name}
													</strong>
												</div>
											</div>
											<div className="recipe__content__reviews__list__item__container__info">
												<div className="recipe__content__reviews__list__item__container__info__star">
													{ratingStar(
														review.score,
														"orange"
													)}{" "}
												</div>
												<div>
													<span
														style={{
															fontSize: "12px",
														}}
													>
														{formatTimestamp(
															review.date_added
														)}
													</span>
												</div>
											</div>

											<p>{review.review}</p>
										</div>
									</li>
								))}
							</ul>
						</Row>
					</Row>
				</Container>
			)}
		</>
	);
};

export default Recipe;
