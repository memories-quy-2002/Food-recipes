import React, { useState } from "react";
import { Row } from "react-bootstrap";
import Pagination from "react-bootstrap/Pagination";
import convertImage from "../../../utils/convertImage";
import formatTimestamp from "../../../utils/formatTimestamp";
import ratingStar from "../../../utils/ratingStar";

const REVIEWS_PER_PAGE = 5;

const RecipeReviewList = ({ reviewList }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const numberReviews = reviewList.length;
	const totalPages = Math.ceil(numberReviews / REVIEWS_PER_PAGE);

	const calculatePageNumbers = () => {
		const pageNumbers = [];
		for (let i = 1; i <= totalPages; i++) {
			pageNumbers.push(i);
		}
		return pageNumbers;
	};
	const pageNumbers = calculatePageNumbers();

	const indexOfLastReview = currentPage * REVIEWS_PER_PAGE;
	const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE;
	const currentReviews = reviewList.slice(
		indexOfFirstReview,
		indexOfLastReview
	);

	const calculateDisplayedPages = () => {
		const firstPage = Math.max(
			currentPage - Math.floor(REVIEWS_PER_PAGE / 2),
			1
		);
		const lastPage = Math.min(firstPage + REVIEWS_PER_PAGE - 1, totalPages);
		return pageNumbers.slice(firstPage - 1, lastPage);
	};

	const displayedPages = calculateDisplayedPages();

	const handlePagination = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

	// Use 'displayedPages' and 'currentReviews' in your UI

	return (
		<>
			{" "}
			<Row className="recipe__content__reviews">
				<h3>All reviews ({numberReviews})</h3>
				<ul className="recipe__content__reviews__list">
					{currentReviews.map((review) => (
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
			<Pagination className="food__content__section__pagination">
				{totalPages <= 5 ? (
					pageNumbers.map((number) => (
						<Pagination.Item
							key={number}
							active={number === currentPage}
							onClick={() => handlePagination(number)}
						>
							{number}
						</Pagination.Item>
					))
				) : (
					<>
						<Pagination.First onClick={() => handlePagination(1)} />
						<Pagination.Prev
							onClick={() =>
								handlePagination(
									currentPage > 1 ? currentPage - 1 : 1
								)
							}
						/>

						{displayedPages.map((number) => (
							<Pagination.Item
								key={number}
								active={number === currentPage}
								onClick={() => handlePagination(number)}
							>
								{number}
							</Pagination.Item>
						))}

						<Pagination.Next
							onClick={() =>
								handlePagination(
									currentPage <
										Math.ceil(
											numberReviews / REVIEWS_PER_PAGE
										)
										? currentPage + 1
										: Math.ceil(
												numberReviews / REVIEWS_PER_PAGE
										  )
								)
							}
						/>
						<Pagination.Last
							onClick={() =>
								handlePagination(
									Math.ceil(numberReviews / REVIEWS_PER_PAGE)
								)
							}
						/>
					</>
				)}
			</Pagination>
		</>
	);
};

export default RecipeReviewList;
