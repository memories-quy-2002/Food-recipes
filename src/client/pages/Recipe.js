import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { Col, Container, Row } from "react-bootstrap";
import axios from "../api/axios";
import "../styles/Recipe.scss";
import convertImage from "../utils/convertImage";
import convertTime from "../utils/convertTime";
import { BsHeart } from "react-icons/bs";

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
			{
				<Container fluid>
					<div className="recipe__container">
						<h1 className="recipe__container__title">
							{recipe_name}
						</h1>
						<div className="recipe__container__content">
							<Row>
								<p className="recipe__container__content__desc">
									{recipe_description}
								</p>
							</Row>
							<Row>
								<Col md={3}>
									<div className="recipe__container__content__fav">
										<button type="button">
											Save <BsHeart size={20} />
										</button>
									</div>
								</Col>
							</Row>
							<Row>
								{convertImage(
									recipe_name,
									"recipe__container__content__img"
								)}
							</Row>
							<Row>
								<Col md={6}>
									<h5>Category</h5>
									<p>{category_name}</p>
								</Col>
								<Col md={6}>
									<h5>Meal</h5>
									<p>{meal_name}</p>
								</Col>
							</Row>
							<Row>
								<Col md={6}>
									<h5>Cook time</h5>
									<p>{convertTime(cook_time)}</p>
								</Col>
								<Col md={6}>
									<h5>Preparation time</h5>
									<p>{convertTime(prep_time)}</p>
								</Col>
							</Row>
						</div>
					</div>
				</Container>
			}
		</Layout>
	);
};

export default Recipe;
