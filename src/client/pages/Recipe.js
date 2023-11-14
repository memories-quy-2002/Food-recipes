import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { BsFillStarFill, BsHeart, BsStarHalf } from "react-icons/bs";
import { useLocation } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import additionTime from "../utils/additionTime";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");

	useEffect(() => {
		(async () => {
			const response = await axios.get(`/recipe/${id}`);
			if (response.status === 200) {
				setRecipe(response.data.recipe);
			}
		})();
	}, [id]);
	// if (!recipe) {
	// 	return (
	// 		<Layout>
	// 			<div>Loading...</div>
	// 		</Layout>
	// 	);
	// }

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
									<p>By Nguyen Quy</p>
								</div>
								<div className="recipe__container__summary__date">
									<p>November 9, 2023</p>
								</div>
								<div className="recipe__container__summary__fav">
									<button type="button">
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
					</Row>
				</Container>
			)}
		</>
	);
};

export default Recipe;
