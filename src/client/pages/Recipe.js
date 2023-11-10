import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { Col, Container, Row } from "react-bootstrap";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";
import { BsFillStarFill, BsHeart, BsStarHalf } from "react-icons/bs";
import additionTime from "../utils/additionTime";

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
	if (!recipe) {
		return (
			<Layout>
				<div>Loading...</div>
			</Layout>
		);
	}
	const {
		recipe_name,
		category_name,
		meal_name,
		cook_time,
		prep_time,
		recipe_description,
	} = recipe;
	return (
		<Layout>
			<Container fluid style={{ padding: 0 }}>
				<Row className="recipe__container">
					<Col md={6}>
						<div className="recipe__container__summary">
							<div className="recipe__container__summary__title">
								<h1>{recipe_name}</h1>
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
						{convertImage(recipe_name, "recipe__container__img")}
					</Col>
				</Row>
				<Row className="recipe__content">
					<Row className="recipe__content__time">
						<Col md={4}>
							<h5>Cook time</h5>
							<p>{convertTime(cook_time)}</p>
						</Col>
						<Col md={4}>
							<h5>Preparation time</h5>
							<p>{convertTime(prep_time)}</p>
						</Col>
						<Col md={4}>
							<h5>Total time</h5>
							<p>{additionTime(prep_time, cook_time)}</p>
						</Col>
					</Row>
					<Row className="recipe__content_desc">
						<div>
							<p>{recipe_description}</p>
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
		</Layout>
	);
};

export default Recipe;
