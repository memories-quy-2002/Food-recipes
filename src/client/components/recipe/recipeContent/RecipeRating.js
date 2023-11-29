import React from "react";
import { Row, Form, Button } from "react-bootstrap";
import ratingStar from "../../../utils/ratingStar";
import { BsStarFill, BsStar } from "react-icons/bs";
import convertImage from "../../../utils/convertImage";
import formatTimestamp from "../../../utils/formatTimestamp";
const RecipeRating = ({
	ratingScore,
	review,
	reviewList,
	showReview,
	isAuthenticated,
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
								Rating the recipe
							</Form.Label>
							<div className="recipe__content__rating__star">
								{[1, 2, 3, 4, 5].map((star) => (
									<span
										key={star}
										onClick={() => onStarClick(star)}
										style={{
											cursor: "pointer",
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
									style={{
										fontWeight: "bold",
										fontSize: "20px",
										marginLeft: "0.5rem",
									}}
								>
									({parseInt(ratingScore)})
								</span>
							</div>
						</Form.Group>

						<div className="recipe__content__rating__review">
							<p
								style={{ color: "orange" }}
								className="recipe__content__rating__review__show"
								onClick={onToggleReview}
							>
								{showReview
									? "Hide your review"
									: "Show your review"}
							</p>
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
										onChange={onReviewChange}
										className="border border-1 border-warning mb-3 recipe__content__rating__review__area"
									/>
								</Form.Group>
							)}
						</div>
						<Form.Group
							controlId="formBasicSubmit"
							className="recipe__content__rating__submit"
						>
							<Button variant="primary" type="submit">
								Submit
							</Button>
						</Form.Group>
					</Form>
				</Row>
			)}
			<Row className="recipe__content__reviews">
				<h3>All reviews ({reviewList.length})</h3>
				<ul className="recipe__content__reviews__list">
					{reviewList.map((review) => (
						<li
							key={review.rating_id}
							className="recipe__content__reviews__list__item"
						>
							<div className="recipe__content__reviews__list__item__container">
								<div className="recipe__content__reviews__list__item__container__context">
									<div>
										{convertImage(
											"avatar",
											"recipe__content__reviews__list__item__container__context__img"
										)}
										<strong>{review.full_name}</strong>
									</div>
								</div>
								<div className="recipe__content__reviews__list__item__container__info">
									<div className="recipe__content__reviews__list__item__container__info__star">
										{ratingStar(review.score, "orange")}{" "}
									</div>
									<div>
										<span
											style={{
												fontSize: "12px",
											}}
										>
											{formatTimestamp(review.date_added)}
										</span>
									</div>
								</div>

								<p>{review.review}</p>
							</div>
						</li>
					))}
				</ul>
			</Row>
		</>
	);
};

export default RecipeRating;
