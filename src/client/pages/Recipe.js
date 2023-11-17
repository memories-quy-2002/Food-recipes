import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { BsFillStarFill, BsHeart, BsStarHalf } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import additionTime from "../utils/additionTime";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";
import { useSelector } from "react-redux";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const [rating, setRating] = useState(0);
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
		setRating(event.target.value);
	};

	const handleReviewChange = (event) => {
		setReview(event.target.value);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		console.log(`Rating: ${rating}, Review: ${review}`);
	};

	const handleClickFavorite = async () => {
		if (!isAuthenticated) navigate("/account");
		try {
			const response = await axios.post("/wishlist", {
				user_id: user_id,
				recipe_id: recipe.recipe_id,
			});
			console.log(response);
			window.location.reload(false);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		(async () => {
			const response = await axios.get(`/recipe/${id}`);
			if (response.status === 200) {
				setRecipe(response.data.recipe);
			}
		})();
	}, [id]);

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
										<BsHeart size={24} />{" "}
										<strong>Save recipe</strong>
									</button>
								</div>
								<div className="recipe__container__summary__review">
									<div className="recipe__container__summary__review__score">
										<strong>4.7</strong>
									</div>
									<div className="recipe__container__summary__review__stars">
										<div>
											<BsFillStarFill />
										</div>
										<div>
											<BsFillStarFill />
										</div>
										<div>
											<BsFillStarFill />
										</div>
										<div>
											<BsFillStarFill />
										</div>
										<div>
											<BsStarHalf />
										</div>
									</div>
									<div className="recipe__container__summary__review__count">
										<strong>(223)</strong>
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
											value={rating}
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
