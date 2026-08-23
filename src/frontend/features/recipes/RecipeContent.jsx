import React from "react";
import { Row } from "react-bootstrap";
import RecipeDescription from "./content/RecipeDescription";
import RecipeRating from "./content/RecipeRating";
const RecipeContent = ({
	recipe,
	ratingScore,
	showReview,
	review,
	reviewList,
	reviewMessage,
	hasExistingRating,
	isRecipeAuthor,
	canMutateReview,
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
				canMutateReview={canMutateReview}
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
