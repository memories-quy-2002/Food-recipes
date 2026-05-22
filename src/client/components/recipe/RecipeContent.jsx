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
	reviewMessage,
	hasExistingRating,
	isLoadingReviews,
	reviewsError,
	isAuthenticated,
	isSubmittingReview,
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
				reviewMessage={reviewMessage}
				hasExistingRating={hasExistingRating}
				isLoadingReviews={isLoadingReviews}
				reviewsError={reviewsError}
				showReview={showReview}
				isAuthenticated={isAuthenticated}
				isSubmittingReview={isSubmittingReview}
				onSubmit={onSubmit}
				onStarClick={onStarClick}
				onToggleReview={onToggleReview}
				onReviewChange={onReviewChange}
			/>
		</Row>
	);
};

export default RecipeContent;
