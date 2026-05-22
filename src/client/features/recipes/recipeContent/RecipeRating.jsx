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
	isSubmittingReview,
	onSubmit,
	onStarClick,
	onToggleReview,
	onReviewChange,
}) => {
	return (
		<>
			{!isAuthenticated ? (
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
							<div className="recipe__content__rating__star">
								{[1, 2, 3, 4, 5].map((star) => (
									<span
										key={star}
										role="button"
										tabIndex={0}
										aria-label={`Rate ${star} out of 5`}
										onClick={() => onStarClick(star)}
										onKeyDown={(event) => {
											if (
												event.key === "Enter" ||
												event.key === " "
											) {
												event.preventDefault();
												onStarClick(star);
											}
										}}
									>
										{star <= ratingScore ? (
											<BsStarFill
												size={24}
												color="orange"
											/>
										) : (
											<BsStar size={24} color="orange" />
										)}
									</span>
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
							<Button
								variant="primary"
								type="submit"
								disabled={isSubmittingReview || !ratingScore}
							>
								{isSubmittingReview
									? "Saving..."
									: hasExistingRating
									? "Update review"
									: "Submit review"}
							</Button>
						</Form.Group>
					</Form>
				</Row>
			)}
			{isLoadingReviews ? (
				<Row className="recipe__content__reviews">
					<p className="recipe__content__reviews__empty">
						Loading reviews...
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
