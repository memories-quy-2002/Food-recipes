import React from "react";
import Layout from "../components/layout/Layout";
import { Container } from "react-bootstrap";
import "../styles/Food.scss";

const Food = () => {
	return (
		<Layout>
			<Container>
				<h1 className="food__title">Choose your food</h1>
			</Container>
		</Layout>
	);
};

export default Food;
