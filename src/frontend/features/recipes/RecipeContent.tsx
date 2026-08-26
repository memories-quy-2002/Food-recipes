import React from "react";
import RecipeDescription from "./content/RecipeDescription";
import RecipeRating from "./content/RecipeRating";
import type { RecipeRatingProps } from "./content/RecipeRating";
import type { RecipeDetail, RecipeMetadata } from "@/shared/api/contracts";
import RecipeMetadataPanel from "./RecipeMetadataPanel";

type RecipeContentRecipe = Omit<Partial<RecipeDetail>, "metadata"> & {
	recipe_id: number;
	metadata?: RecipeMetadata | null;
};

export type RecipeContentProps = Omit<RecipeRatingProps, "reviewList" | "reviewMessage"> & {
	recipe: RecipeContentRecipe;
	reviewList: RecipeRatingProps["reviewList"];
	reviewMessage: RecipeRatingProps["reviewMessage"];
};

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
}: RecipeContentProps): React.ReactElement => {
	return (
		<section
			className="mx-auto w-full max-w-[100rem] space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:space-y-10 lg:px-8 lg:py-12 2xl:max-w-[108rem]"
			aria-label="Recipe cooking details"
		>
			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start xl:gap-10">
				<div data-testid="recipe-cooking-core" className="min-w-0">
					<RecipeDescription recipe={recipe} />
				</div>
				<aside data-testid="recipe-supporting-details" className="min-w-0 space-y-6">
					<RecipeMetadataPanel metadata={recipe.metadata} />
				</aside>
			</div>
			<section data-testid="recipe-community" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
				<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Community</p>
						<h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Reviews and cooking notes</h2>
					</div>
				</div>
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
		</section>
	);
};

export default RecipeContent;
