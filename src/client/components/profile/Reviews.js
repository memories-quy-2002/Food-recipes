import React from "react";
import convertImage from "../../utils/convertImage";
import ratingStar from "../../utils/ratingStar";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
const Reviews = ({ reviewsData = [] }) => {
	const navigate = useNavigate();
	const handleClickEdit = (recipeId) => {
		navigate(`/recipe?id=${recipeId}`);
	};
	console.log(reviewsData);
	return (
		<div className="profile__container__main__reviews">
			<div>
				<h4 className="profile__container__main__reviews__title">
					My reviews
				</h4>

				<Row className="profile__container__main__reviews__summary">
					<Col md={6}>
						<div className="profile__container__main__reviews__summary__item">
							<strong>{reviewsData.length}</strong>
							<p>rating(s)</p>
						</div>{" "}
					</Col>
					<Col md={6}>
						<div className="profile__container__main__reviews__summary__item">
							<strong>
								{
									reviewsData.filter(
										(review) => review.review !== ""
									).length
								}
							</strong>
							<p>comment(s)</p>
						</div>{" "}
					</Col>
				</Row>
				<ul className="profile__container__main__reviews__list">
					{reviewsData.map((review) => (
						<li
							key={review.rating_id}
							className="profile__container__main__reviews__list__item"
						>
							<div>
								<div
									className="d-flex gap-4 align-items-center mb-3 border border-1 p-2"
									style={{ borderRadius: "1rem" }}
								>
									<div>
										{convertImage(
											review.recipe_name,
											"profile__container__main__reviews__list__item__img"
										)}
									</div>
									{review.recipe_name}
								</div>
								<div>
									<div className="d-flex gap-3 mb-3">
										<div className="d-flex gap-2">
											{ratingStar(review.score, "orange")}
										</div>
										<div>{parseInt(review.score)}</div>
									</div>

									<p>{review.review}</p>
								</div>
								<div className="w-100 d-flex justify-content-end">
									<button
										className="btn btn-primary"
										type="button"
										onClick={() =>
											handleClickEdit(review.recipe_id)
										}
									>
										Edit review
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default Reviews;
