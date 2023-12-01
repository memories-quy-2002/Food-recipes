import React from "react";
import { Row, Col } from "react-bootstrap";
import convertTime from "../../../utils/convertTime";
import additionTime from "../../../utils/additionTime";

const RecipeDescription = ({ recipe }) => {
	return (
		<>
			<Row className="recipe__content__desc">
				<div>
					<p>
						{recipe.recipe_description ??
							"There is no description for this recipe"}
					</p>
				</div>
			</Row>
			<Row className="recipe__content__time">
				<Col md={4}>
					<h5>Preparation time</h5>
					<p>
						{recipe.prep_time
							? convertTime(recipe.prep_time)
							: "No information"}
					</p>
				</Col>
				<Col md={4}>
					<h5>Cook time</h5>
					<p>
						{recipe.cook_time
							? convertTime(recipe.cook_time)
							: "No information"}
					</p>
				</Col>
				<Col md={4}>
					<h5>Total time</h5>
					<p>
						{recipe.cook_time || recipe.prep_time
							? additionTime(recipe.prep_time, recipe.cook_time)
							: "No information"}
					</p>
				</Col>
			</Row>
			<Row className="recipe__content__ingredient">
				<div>
					<h5>Ingredients</h5>
					<ul>
						{recipe.ingredients
							? recipe.ingredients.map((ingredient, index) => (
									<li key={index}>{ingredient}</li>
							  ))
							: "No information"}
					</ul>
				</div>
			</Row>
			<Row className="recipe__content__instruction">
				<div>
					<h5>Instructions</h5>
					<ul>
						{recipe.instructions
							? recipe.instructions.map((instruction, index) => (
									<li key={index}>
										Step {index + 1}: {instruction}
									</li>
							  ))
							: "No information"}
					</ul>
				</div>
			</Row>
		</>
	);
};

export default RecipeDescription;
