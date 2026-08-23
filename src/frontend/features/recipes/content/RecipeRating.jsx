import React from "react";
import { Button, Form, Row } from "react-bootstrap";
import { BsStar, BsStarFill } from "react-icons/bs";
import RecipeReviewList from "./RecipeReviewList";

const RecipeRating = ({
	ratingScore,
	review,
	reviewList,
	reviewMessage,
	hasExistingRating,
	isLoadingReviews,
	reviewsError,
	showReview,
	isAuthenticated,
	isRecipeAuthor,
	canMutateReview,
	canDeleteReview,
	isSubmittingReview,
	isDeletingReview,
	onSubmit,
	onDelete,
	onStarClick,
	onToggleReview,
	onReviewChange,
}) => {
	return (
		<>
			{isRecipeAuthor ? (
				<Row className="recipe__content__rating">
					<div className="recipe__content__rating__signin" role="note">
						<strong>
							You cannot review your own recipe. Other cooks can rate and review it here.
						</strong>
					</div>
				</Row>
			) : !canMutateReview ? (
				<Row className="recipe__content__rating">
					<div className="recipe__content__rating__signin" role="note">
						<strong>
							Community review mutations are unavailable until an ownership-safe API is configured.
						</strong>
					</div>
				</Row>
			) : !isAuthenticated ? (
				<Row className="recipe__content__rating">
					<div className="recipe__content__rating__signin">
						<strong>
							<span>
								<a href="/account/?signup=false">Sign in</a>
							</span>{" "}
							to leave a Rating and Review
						</strong>
					</div>
				</Row>
			) : (
				<Row className="recipe__content__rating">
					<Form onSubmit={onSubmit}>
						<Form.Group controlId="formBasicRating">
							<Form.Label className="fw-bold fs-5 my-3">
								{hasExistingRating
									? "Update your review"
									: "Rate this recipe"}
							</Form.Label>
							<div
								className="recipe__content__rating__star"
								role="group"
								aria-label="Recipe rating"
							>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										className="recipe__content__rating__star__button"
										aria-label={`Rate ${star} out of 5`}
										aria-pressed={star === ratingScore}
										onClick={() => onStarClick(star)}
									>
										{star <= ratingScore ? (
											<BsStarFill
												size={24}
												color="orange"
												aria-hidden="true"
											/>
										) : (
											<BsStar
												size={24}
												color="orange"
												aria-hidden="true"
											/>
										)}
									</button>
								))}
								<span
									className="recipe__content__rating__star__score"
								>
									({parseInt(ratingScore)})
								</span>
							</div>
							<p className="recipe__content__rating__hint">
								{hasExistingRating
									? "You already reviewed this recipe. Saving will update your existing review."
									: "Choose a score, then add an optional written review."}
							</p>
						</Form.Group>
						{reviewMessage && (
							<div
								className={`recipe__content__rating__message recipe__content__rating__message--${reviewMessage.type}`}
								role={reviewMessage.type === "error" ? "alert" : "status"}
								aria-live="polite"
							>
								{reviewMessage.text}
							</div>
						)}

						<div className="recipe__content__rating__review">
							<button
								type="button"
								className="recipe__content__rating__review__show"
								onClick={onToggleReview}
							>
								{showReview
									? "Hide review"
									: "Show & edit review"}
							</button>
							{showReview && (
								<Form.Group controlId="formBasicReview">
									<Form.Label className="fw-bold fs-5 my-2">
										Review
									</Form.Label>
									<Form.Control
										as="textarea"
										rows={3}
										placeholder="Enter your review"
										value={review}
										maxLength={500}
										onChange={onReviewChange}
										className="recipe__content__rating__review__area"
									/>
									<div className="recipe__content__rating__review__count">
										{review.length}/500
									</div>
								</Form.Group>
							)}
						</div>
						<Form.Group
							controlId="formBasicSubmit"
							className="recipe__content__rating__submit"
						>
							<div className="recipe__content__rating__actions">
								<Button
									variant="primary"
									type="submit"
									disabled={isSubmittingReview || isDeletingReview || !ratingScore}
								>
									{isSubmittingReview
										? "Saving…"
										: hasExistingRating
										? "Update review"
										: "Submit review"}
								</Button>
								{hasExistingRating && canDeleteReview && (
									<Button
										variant="outline-danger"
										type="button"
										disabled={isSubmittingReview || isDeletingReview}
										onClick={onDelete}
									>
										{isDeletingReview ? "Deleting…" : "Delete my review"}
									</Button>
								)}
							</div>
						</Form.Group>
					</Form>
				</Row>
			)}
			{isLoadingReviews ? (
				<Row className="recipe__content__reviews">
					<p className="recipe__content__reviews__empty">
						Loading reviews…
					</p>
				</Row>
			) : reviewsError ? (
				<Row className="recipe__content__reviews">
					<p className="recipe__content__reviews__empty">
						{reviewsError}
					</p>
				</Row>
			) : (
				<RecipeReviewList reviewList={reviewList} />
			)}
		</>
	);
};

export default RecipeRating;
