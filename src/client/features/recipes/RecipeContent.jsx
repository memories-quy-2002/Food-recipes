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
	isRecipeAuthor,
	canDeleteReview,
	isLoadingReviews,
	reviewsError,
	isAuthenticated,
	isSubmittingReview,
	isDeletingReview,
	onSubmit,
	onDelete,
	onStarClick,
	onToggleReview,
	onReviewChange,
}) => {
	return (
		<Row className="recipe__content" aria-label="Recipe cooking details">
			<RecipeDescription recipe={recipe} />
			<RecipeRating
				ratingScore={ratingScore}
				review={review}
				reviewList={reviewList}
				reviewMessage={reviewMessage}
				hasExistingRating={hasExistingRating}
				isRecipeAuthor={isRecipeAuthor}
				canDeleteReview={canDeleteReview}
				isLoadingReviews={isLoadingReviews}
				reviewsError={reviewsError}
				showReview={showReview}
				isAuthenticated={isAuthenticated}
				isSubmittingReview={isSubmittingReview}
				isDeletingReview={isDeletingReview}
				onSubmit={onSubmit}
				onDelete={onDelete}
				onStarClick={onStarClick}
				onToggleReview={onToggleReview}
				onReviewChange={onReviewChange}
			/>
		</Row>
	);
};

export default RecipeContent;
