import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { Container } from "react-bootstrap";
import axios from "../api/axios";

const Recipe = () => {
	const [recipe, setRecipe] = useState(null);
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");

	useEffect(() => {
		axios
			.get(`http://localhost:4000/recipe/${id}`)
			.then((response) => setRecipe(response.data.recipe))
			.catch((error) => console.error(error));
	}, [id]);

	if (!recipe) {
		return <div>Loading...</div>;
	}

	const { recipe_name, recipe_description } = recipe;

	const imgName = recipe_name.toLowerCase().replace(" ", "_");

	return (
		<Layout>
			<Container fluid>
				<div className="recipe__container">
					<h1>{recipe_name}</h1>
					<img
						src={require(`../assets/images/${imgName}.png`)}
						alt={recipe_name}
					></img>
					<p>{recipe_description}</p>
				</div>
			</Container>
		</Layout>
	);
};

export default Recipe;
