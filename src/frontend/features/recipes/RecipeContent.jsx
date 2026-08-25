import React from "react";
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
		<section
			className="mx-auto w-full max-w-[100rem] space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:space-y-10 lg:px-8 lg:py-12 2xl:max-w-[108rem]"
			aria-label="Recipe cooking details"
		>
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
		</section>
	);
};

export default RecipeContent;
