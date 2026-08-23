import React from "react";
import { Col, Row } from "react-bootstrap";
import { BsHeart, BsHeartFill } from "react-icons/bs";
import convertImage from "@/shared/utils/convertImage";
import formatTimestamp from "@/shared/utils/formatTimestamp";
import ratingStar from "@/shared/utils/ratingStar";

const RecipeContainerSummary = ({ recipe, favorite, onClickFavorite }) => {
	const tags = [recipe.category_name, recipe.meal_name, recipe.difficulty ?? recipe.difficulty_level].filter(Boolean);

	return (
		<Row className="recipe__container">
			<Col md={6}>
				<div className="recipe__container__summary">
					<div className="recipe__container__summary__title"><h1>{recipe.recipe_name}</h1></div>
					<div className="recipe__container__summary__review" aria-label={`Rated ${recipe.overall_score ?? 0} out of 5 from ${recipe.num_ratings ?? 0} ratings`}>
						<div className="recipe__container__summary__review__score"><strong>{Number(recipe.overall_score || 0).toFixed(1)}</strong></div>
						<div className="recipe__container__summary__review__stars" aria-hidden="true">{ratingStar(recipe.overall_score, "").map((star) => star)}</div>
						<div className="recipe__container__summary__review__count"><strong>{recipe.num_ratings ?? 0} ratings</strong></div>
					</div>
					<div className="recipe__container__summary__author"><p>By {recipe.full_name ?? "Food recipe"}</p></div>
					{tags.length > 0 && <div className="recipe__container__summary__tags" aria-label="Recipe details">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
					<div className="recipe__container__summary__date"><p>{formatTimestamp(recipe.date_added)}</p></div>
					<div className="recipe__container__summary__fav">
						<a className="recipe__container__summary__start" href="#ingredients">Start cooking</a>
						<button type="button" onClick={onClickFavorite} aria-label={favorite ? "Remove from favorite" : "Add to favorite"}>
							{favorite ? <BsHeartFill size={24} color="white" /> : <BsHeart size={24} color="white" />}
							<strong>{favorite ? "Remove from favorite" : "Add to favorite"}</strong>
						</button>
					</div>
				</div>
			</Col>
			<Col md={6}>{convertImage(recipe.recipe_name, "recipe__container__img", recipe.image_url)}</Col>
		</Row>
	);
};

export default RecipeContainerSummary;
