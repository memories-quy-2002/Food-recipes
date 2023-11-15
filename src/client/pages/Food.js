import React, { Suspense, lazy, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import axios from "../api/axios";
import MenuBar from "../components/food/MenuBar";
import "../styles/Food.scss";
const FoodContent = lazy(() => import("../components/food/FoodContent"));

const Food = () => {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const categoryId = searchParams.get("categories");
	const mealId = searchParams.get("meals");
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get("/category");
			setCategories(response.data.categories);
		};
		const fetchMeals = async () => {
			const response = await axios.get("/meal");
			setMeals(response.data.meals);
		};
		fetchCategories();
		fetchMeals();
	}, []);
	return (
		<Container fluid className="my-3">
			<Row>
				<Col md={3}>
					<MenuBar
						categoryId={categoryId}
						mealId={mealId}
						categories={categories}
						meals={meals}
					/>
				</Col>
				<Col md={9}>
					<Suspense
						fallback={
							<div className="app__loaderContainer">
								<div className="app__loader"></div>
							</div>
						}
					>
						<FoodContent categoryId={categoryId} mealId={mealId} />
					</Suspense>
				</Col>
			</Row>
		</Container>
	);
};

export default Food;
