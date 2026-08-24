import React from "react";
import { Row } from "@/shared/ui/legacy-ui";
import RecipeDescription from "./content/RecipeDescription";
import RecipeRating from "./content/RecipeRating";
import RecipeMetadataPanel from "./RecipeMetadataPanel";
import SuggestionPanel from "@/features/suggestions/SuggestionPanel";
const RecipeContent = ({
	recipe,
	isAuthenticated,
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
			<RecipeMetadataPanel metadata={recipe.metadata} />
			<SuggestionPanel mode="substitution" recipeId={recipe.recipe_id} isAuthenticated={isAuthenticated} />
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
