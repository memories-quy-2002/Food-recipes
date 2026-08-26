import React from "react";
import { Link } from "react-router-dom";
import { BsStar, BsStarFill } from "react-icons/bs";
import RecipeReviewList from "./RecipeReviewList";
import type { RecipeReview } from "./RecipeReviewList";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";

type ReviewMessage = {
	type: "error" | "success";
	text: string;
};

const Notice = ({ children }: { children: React.ReactNode }): React.ReactElement => (
	<div className="rounded-2xl border border-border bg-muted/60 px-5 py-4 text-sm leading-6 text-muted-foreground" role="note">
		{children}
	</div>
);

export type RecipeRatingProps = {
	ratingScore: number;
	review: string;
	reviewList: RecipeReview[];
	reviewMessage: ReviewMessage | null;
	hasExistingRating: boolean;
	isLoadingReviews: boolean;
	reviewsError: string | null;
	showReview: boolean;
	isAuthenticated: boolean;
	isRecipeAuthor: boolean;
	canMutateReview: boolean;
	canDeleteReview: boolean;
	isSubmittingReview: boolean;
	isDeletingReview: boolean;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
	onDelete: () => void | Promise<void>;
	onStarClick: (rating: number) => void;
	onToggleReview: () => void;
	onReviewChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const RecipeRating = ({
	ratingScore, review, reviewList, reviewMessage, hasExistingRating,
	isLoadingReviews, reviewsError, showReview, isAuthenticated,
	isRecipeAuthor, canMutateReview, canDeleteReview, isSubmittingReview,
	isDeletingReview, onSubmit, onDelete, onStarClick, onToggleReview, onReviewChange,
}: RecipeRatingProps): React.ReactElement => (
	<section className="space-y-6" aria-labelledby="recipe-reviews-title">
		<div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
			<h2 id="recipe-reviews-title" className="text-2xl font-black tracking-tight sm:text-3xl">Ratings & reviews</h2>
			<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Share what worked for you and help the next cook decide.</p>
			<div className="mt-6">
				{isRecipeAuthor ? (
					<Notice><strong className="font-black">You cannot review your own recipe.</strong> Other cooks can rate and review it here.</Notice>
				) : !canMutateReview ? (
					<Notice>Community review updates are temporarily unavailable.</Notice>
				) : !isAuthenticated ? (
					<Notice><Link className="font-black text-primary underline underline-offset-4" to="/account/?signup=false">Sign in</Link> to rate this recipe or leave a review.</Notice>
				) : (
					<form className="space-y-5" onSubmit={onSubmit}>
						<div>
							<p className="text-base font-black text-foreground">{hasExistingRating ? "Update your review" : "Rate this recipe"}</p>
							<div className="mt-3 flex flex-wrap items-center gap-1" role="group" aria-label="Recipe rating">
								{[1, 2, 3, 4, 5].map((star) => (
									<button key={star} type="button" className="inline-flex size-11 items-center justify-center rounded-full text-primary transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Rate ${star} out of 5`} aria-pressed={star === ratingScore} onClick={() => onStarClick(star)}>
										{star <= ratingScore ? <BsStarFill size={24} aria-hidden="true" /> : <BsStar size={24} aria-hidden="true" />}
									</button>
								))}
								<span className="ml-2 text-sm font-black text-foreground">{ratingScore ? `${ratingScore}/5` : "Choose a rating"}</span>
							</div>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{hasExistingRating ? "Saving will update your existing rating and review." : "A written review is optional."}</p>
						</div>

						{reviewMessage ? <div className={cn("rounded-xl border px-4 py-3 text-sm font-semibold", reviewMessage.type === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-secondary/60 bg-secondary/30 text-foreground")} role={reviewMessage.type === "error" ? "alert" : "status"} aria-live="polite">{reviewMessage.text}</div> : null}

						<div>
							<Button type="button" variant="outline" className="rounded-full" onClick={onToggleReview}>{showReview ? "Hide written review" : hasExistingRating ? "Edit written review" : "Add a written review"}</Button>
							{showReview ? (
								<div className="mt-4">
									<label className="text-sm font-black text-foreground" htmlFor="recipe-review">Your review</label>
									<textarea id="recipe-review" rows={5} placeholder="What did you like? Any tips for the next cook?" value={review} maxLength={500} onChange={onReviewChange} className="mt-2 min-h-36 w-full resize-y rounded-xl border border-input bg-background px-4 py-3.5 text-base leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-ring focus:ring-4 focus:ring-ring/20 sm:text-sm" />
									<p className="mt-1 text-right text-xs text-muted-foreground">{review.length}/500</p>
								</div>
							) : null}
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Button type="submit" size="lg" className="rounded-xl font-black" disabled={isSubmittingReview || isDeletingReview || !ratingScore}>{isSubmittingReview ? "Saving…" : hasExistingRating ? "Update review" : "Submit review"}</Button>
							{hasExistingRating && canDeleteReview ? <Button variant="destructive" type="button" size="lg" className="rounded-xl font-black" disabled={isSubmittingReview || isDeletingReview} onClick={onDelete}>{isDeletingReview ? "Deleting…" : "Delete my review"}</Button> : null}
						</div>
					</form>
				)}
			</div>
		</div>

		{isLoadingReviews ? <div className="rounded-2xl border border-border bg-card px-5 py-8 text-sm text-muted-foreground">Loading reviews…</div> : reviewsError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-5 text-sm text-destructive" role="alert">{reviewsError}</div> : <RecipeReviewList reviewList={reviewList} />}
	</section>
);

export default RecipeRating;
