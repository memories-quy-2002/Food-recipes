import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { BsFillHeartFill, BsHeart } from "react-icons/bs";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import additionTime from "../utils/additionTime";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";
import ratingStar from "../utils/ratingStar";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const [favorite, setFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [review, setReview] = useState("");
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

	const handleRatingChange = (event) => {
		setRatingScore(event.target.value);
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
		console.log(`Rating: ${ratingScore}, Review: ${review}`);
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
				const response = await axios.post("/wishlist", {
					user_id: user_id,
					recipe_id: recipe.recipe_id,
				});
				console.log(response);
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
	});

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
									<p>November 17, 2023</p>
								</div>
								<div className="recipe__container__summary__fav">
									<button
										type="button"
										onClick={handleClickFavorite}
									>
										{favorite ? (
											<BsFillHeartFill
												size={24}
												color="orange"
											/>
										) : (
											<BsHeart size={24} color="orange" />
										)}

										<strong>
											{favorite ? "Unsave" : "Save"}
										</strong>
									</button>
								</div>
								<div className="recipe__container__summary__review">
									<div className="recipe__container__summary__review__score">
										<strong>{recipe.overall_score}</strong>
									</div>
									<div className="recipe__container__summary__review__stars">
										{ratingStar(recipe.overall_score).map(
											(star) => star
										)}
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
						<Row className="recipe__content_desc">
							<div>
								<p>{recipe.recipe_description}</p>
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
							<Row>
								<Form onSubmit={handleSubmit}>
									<Form.Group controlId="formBasicRating">
										<Form.Label>Rating</Form.Label>
										<Form.Control
											type="number"
											min="0"
											max="5"
											step="0.1"
											value={ratingScore}
											onChange={handleRatingChange}
										/>
									</Form.Group>

									<Form.Group controlId="formBasicReview">
										<Form.Label>Review</Form.Label>
										<Form.Control
											as="textarea"
											rows={3}
											placeholder="Enter your review"
											value={review}
											onChange={handleReviewChange}
										/>
									</Form.Group>

									<Button variant="primary" type="submit">
										Submit
									</Button>
								</Form>
							</Row>
						)}
					</Row>
				</Container>
			)}
		</>
	);
};

export default Recipe;
