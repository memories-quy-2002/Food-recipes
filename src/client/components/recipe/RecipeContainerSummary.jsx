import React from "react";
import { Col, Row } from "react-bootstrap";
import { BsHeart, BsHeartFill } from "react-icons/bs";
import convertImage from "../../utils/convertImage";
import formatTimestamp from "../../utils/formatTimestamp";
import ratingStar from "../../utils/ratingStar";
const RecipeContainerSummary = ({ recipe, favorite, onClickFavorite }) => {
	return (
		<Row className="recipe__container">
			<Col md={6}>
				<div className="recipe__container__summary">
					<div className="recipe__container__summary__title">
						<h1>{recipe.recipe_name}</h1>
					</div>

					<div className="recipe__container__summary__author">
						<p>By {recipe.full_name ?? "Food recipe"}</p>
					</div>
					<div className="recipe__container__summary__date">
						<p>{formatTimestamp(recipe.date_added)}</p>
					</div>
					<div className="recipe__container__summary__fav">
						<button type="button" onClick={onClickFavorite}>
							{favorite ? (
								<BsHeartFill size={24} color="white" />
							) : (
								<BsHeart size={24} color="white" />
							)}

							<strong
								style={{
									color: "white",
									fontSize: "1.1rem",
								}}
							>
								{favorite
									? "Remove from favorite"
									: "Add to favorite"}
							</strong>
						</button>
					</div>
					<div className="recipe__container__summary__review">
						<div className="recipe__container__summary__review__score">
							<strong>{recipe.overall_score}</strong>
						</div>
						<div className="recipe__container__summary__review__stars">
							{ratingStar(recipe.overall_score, "").map(
								(star) => star
							)}
						</div>
						<div className="recipe__container__summary__review__count">
							<strong>({recipe.num_ratings})</strong>
						</div>
					</div>
				</div>
			</Col>
			<Col md={6}>
				{convertImage(recipe.recipe_name, "recipe__container__img")}
			</Col>
		</Row>
	);
};

export default RecipeContainerSummary;
