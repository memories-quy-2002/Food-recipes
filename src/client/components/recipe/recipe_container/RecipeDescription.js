import React from "react";
import { Row, Col } from "react-bootstrap";
import convertTime from "../../../utils/convertTime";
import additionTime from "../../../utils/additionTime";

const RecipeDescription = ({ recipe }) => {
	return (
		<>
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
					<p>{additionTime(recipe.prep_time, recipe.cook_time)}</p>
				</Col>
			</Row>
			<Row className="recipe__content__desc">
				<div>
					<p>
						{recipe.recipe_description
							? recipe.recipe_description
							: "There is no description for this recipe"}
					</p>
				</div>
			</Row>
		</>
	);
};

export default RecipeDescription;
