import React from "react";
import Layout from "../components/layout/Layout";
import { Col, Container, Row } from "react-bootstrap";
import "../styles/Food.scss";
import MenuBar from "../components/food/MenuBar";
import FoodContent from "../components/food/FoodContent";

const Food = () => {
	return (
		<Layout>
			<Container fluid className="my-3">
				<Row>
					<Col md={3}>
						<MenuBar />
					</Col>
					<Col md={9}>
						<FoodContent />
					</Col>
				</Row>
			</Container>
		</Layout>
	);
};

export default Food;
