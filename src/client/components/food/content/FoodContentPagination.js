import React from "react";
import Pagination from "react-bootstrap/Pagination";

const FoodContentPagination = ({
	recipesPerPage,
	totalRecipes,
	onPagination,
	currentPage,
}) => {
	const pageNumbers = [];
	console.log(totalRecipes);
	for (let i = 1; i <= Math.ceil(totalRecipes / recipesPerPage); i++) {
		pageNumbers.push(i);
	}

	const totalPages = Math.ceil(totalRecipes / recipesPerPage);
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
