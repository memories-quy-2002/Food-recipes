import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { Col, Container, Row } from "react-bootstrap";
import "../styles/Food.scss";
import MenuBar from "../components/food/MenuBar";
import FoodContent from "../components/food/FoodContent";
import { useLocation } from "react-router-dom";
import axios from "../api/axios";

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
		<Layout>
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
						<FoodContent categoryId={categoryId} mealId={mealId} />
					</Col>
				</Row>
			</Container>
		</Layout>
	);
};

export default Food;
