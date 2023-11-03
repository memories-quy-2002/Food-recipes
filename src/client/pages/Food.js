import React from "react";
import Layout from "../components/layout/Layout";
import { Col, Container, Row } from "react-bootstrap";
import "../styles/Food.scss";
import MenuBar from "../components/food/MenuBar";
import FoodContent from "../components/food/FoodContent";
import { useLocation } from "react-router-dom";

const Food = () => {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const categoryId = searchParams.get("categories");
	const mealId = searchParams.get("meals");
	return (
		<Layout>
			<Container fluid className="my-3">
				<Row>
					<Col md={3}>
						<MenuBar categoryId={categoryId} mealId={mealId} />
					</Col>
					<Col md={9}>
						<FoodContent categoryId={categoryId} />
					</Col>
				</Row>
			</Container>
		</Layout>
	);
};

export default Food;
