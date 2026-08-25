import React from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/shared/ui/Button";

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
	if (!totalPages || totalPages <= 1) return null;

	const normalizedCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
	const pageNumbers = getPaginationPageNumbers(totalPages, normalizedCurrentPage);
	const goTo = (page) => onPagination(Math.min(Math.max(page, 1), totalPages));

	return (
		<nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Recipe pages">
			{totalPages > 5 ? (
				<>
					<Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => goTo(1)} disabled={normalizedCurrentPage === 1} aria-label="First recipe page"><ChevronFirst className="size-4" /></Button>
					<Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => goTo(normalizedCurrentPage - 1)} disabled={normalizedCurrentPage === 1} aria-label="Previous recipe page"><ChevronLeft className="size-4" /></Button>
				</>
			) : null}

			{pageNumbers.map((number) => (
				<Button
					key={number}
					variant={number === normalizedCurrentPage ? "default" : "ghost"}
					size="icon"
					className="size-10 rounded-full"
					onClick={() => goTo(number)}
					aria-current={number === normalizedCurrentPage ? "page" : undefined}
					aria-label={`Recipe page ${number}`}
				>
					{number}
				</Button>
			))}

			{totalPages > 5 ? (
				<>
					<Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => goTo(normalizedCurrentPage + 1)} disabled={normalizedCurrentPage === totalPages} aria-label="Next recipe page"><ChevronRight className="size-4" /></Button>
					<Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => goTo(totalPages)} disabled={normalizedCurrentPage === totalPages} aria-label="Last recipe page"><ChevronLast className="size-4" /></Button>
				</>
			) : null}
		</nav>
	);
};

export default FoodContentPagination;
