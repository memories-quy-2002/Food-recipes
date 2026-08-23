import React from "react";
import Pagination from "react-bootstrap/Pagination";

const FoodContentPagination = ({
	recipesPerPage,
	totalRecipes,
	totalPages: providedTotalPages,
	onPagination,
	currentPage,
}) => {
	const pageNumbers = [];
	const totalPages = providedTotalPages ?? Math.ceil(totalRecipes / recipesPerPage);
	for (let i = 1; i <= totalPages; i++) {
		pageNumbers.push(i);
	}
	const firstPage = Math.max(currentPage - 2, 1);
	const lastPage = Math.min(firstPage + 4, totalPages);

	const getDisplayedPages = pageNumbers.slice(firstPage - 1, lastPage);
	return (
		<Pagination className="food__content__section__pagination">
			{totalPages <= 5 ? (
				pageNumbers.map((number) => (
					<Pagination.Item
						key={number}
						active={number === currentPage}
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
							onPagination(currentPage > 1 ? currentPage - 1 : 1)
						}
					/>

					{getDisplayedPages.map((number) => (
						<Pagination.Item
							key={number}
							active={number === currentPage}
							onClick={() => onPagination(number)}
						>
							{number}
						</Pagination.Item>
					))}

					<Pagination.Next
						onClick={() =>
							onPagination(
								currentPage <
									Math.ceil(totalRecipes / recipesPerPage)
									? currentPage + 1
									: Math.ceil(totalRecipes / recipesPerPage)
							)
						}
					/>
					<Pagination.Last
						onClick={() =>
							onPagination(
								Math.ceil(totalRecipes / recipesPerPage)
							)
						}
					/>
				</>
			)}
		</Pagination>
	);
};

export default FoodContentPagination;
