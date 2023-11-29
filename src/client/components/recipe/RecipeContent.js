import React from "react";
import { Row } from "react-bootstrap";
import RecipeDescription from "./recipeContent/RecipeDescription";
import RecipeRating from "./recipeContent/RecipeRating";
const RecipeContent = ({
	recipe,
	ratingScore,
	showReview,
	review,
	reviewList,
	isAuthenticated,
	onSubmit,
	onStarClick,
	onToggleReview,
	onReviewChange,
}) => {
	return (
		<Row className="recipe__content">
			<RecipeDescription recipe={recipe} />
			<RecipeRating
				ratingScore={ratingScore}
				review={review}
				reviewList={reviewList}
				showReview={showReview}
				isAuthenticated={isAuthenticated}
				onSubmit={onSubmit}
				onStarClick={onStarClick}
				onToggleReview={onToggleReview}
				onReviewChange={onReviewChange}
			/>
		</Row>
	);
};

export default RecipeContent;
