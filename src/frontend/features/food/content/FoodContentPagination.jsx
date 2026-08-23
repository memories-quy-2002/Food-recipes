import React from "react";
import Pagination from "react-bootstrap/Pagination";

export const getPaginationPageNumbers = (totalPages, currentPage) => {
	if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

	const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
	return Array.from({ length: 5 }, (_, index) => start + index);
};

const FoodContentPagination = ({
	recipesPerPage,
	totalRecipes,
	totalPages: providedTotalPages,
	onPagination,
	currentPage,
}) => {
	const totalPages = providedTotalPages ?? Math.ceil(totalRecipes / recipesPerPage);
	const normalizedCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
	const pageNumbers = getPaginationPageNumbers(totalPages, normalizedCurrentPage);
	return (
		<Pagination className="food__content__section__pagination">
			{totalPages <= 5 ? (
				pageNumbers.map((number) => (
					<Pagination.Item
						key={number}
						active={number === normalizedCurrentPage}
						onClick={() => onPagination(number)}
					>
						{number}
					</Pagination.Item>
				))
			) : (
				<>
					<Pagination.First onClick={() => onPagination(1)} />
					<Pagination.Prev
						onClick={() =>
							onPagination(normalizedCurrentPage > 1 ? normalizedCurrentPage - 1 : 1)
						}
					/>

					{pageNumbers.map((number) => (
						<Pagination.Item
							key={number}
							active={number === normalizedCurrentPage}
							onClick={() => onPagination(number)}
						>
							{number}
						</Pagination.Item>
					))}

					<Pagination.Next
						onClick={() =>
							onPagination(
								normalizedCurrentPage <
									totalPages
									? normalizedCurrentPage + 1
									: totalPages
							)
						}
					/>
					<Pagination.Last
						onClick={() => onPagination(totalPages)}
					/>
				</>
			)}
		</Pagination>
	);
};

export default FoodContentPagination;
