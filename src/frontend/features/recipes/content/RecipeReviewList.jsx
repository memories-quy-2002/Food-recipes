import React, { useEffect, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import convertImage from "@/shared/utils/convertImage";
import formatTimestamp from "@/shared/utils/formatTimestamp";
import ratingStar from "@/shared/utils/ratingStar";
import Button from "@/shared/ui/Button";

const REVIEWS_PER_PAGE = 5;

const RecipeReviewList = ({ reviewList }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const numberReviews = reviewList.length;
	const totalPages = Math.ceil(numberReviews / REVIEWS_PER_PAGE);

	useEffect(() => setCurrentPage(1), [reviewList]);

	const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
	const firstPage = Math.max(currentPage - Math.floor(REVIEWS_PER_PAGE / 2), 1);
	const lastPage = Math.min(firstPage + REVIEWS_PER_PAGE - 1, totalPages);
	const displayedPages = pageNumbers.slice(firstPage - 1, lastPage);
	const currentReviews = reviewList.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);
	const goTo = (page) => setCurrentPage(Math.min(Math.max(page, 1), Math.max(totalPages, 1)));

	return (
		<section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8" aria-labelledby="all-reviews-heading">
			<h3 id="all-reviews-heading" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">All reviews <span className="text-muted-foreground">({numberReviews})</span></h3>

			{numberReviews === 0 ? (
				<div className="mt-5 rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">No reviews yet. Be the first to share one.</div>
			) : (
				<ul className="mt-5 divide-y divide-border">
					{currentReviews.map((review) => (
						<li key={review.rating_id} className="py-5 first:pt-0 last:pb-0">
							<div className="flex items-start gap-3">
								{convertImage("avatar", "size-11 shrink-0 rounded-full border border-border object-cover sm:size-12")}
								<div className="min-w-0 flex-1">
									<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
										<strong className="truncate text-sm font-black text-foreground">{review.full_name || "Anonymous cook"}</strong>
										<time className="text-xs text-muted-foreground" dateTime={review.date_added || undefined}>{formatTimestamp(review.date_added)}</time>
									</div>
									<div className="mt-2 flex items-center gap-1 text-primary" aria-label={`Rated ${review.score || 0} out of 5`}>{ratingStar(review.score, "currentColor")}</div>
									<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground sm:text-base">{review.review || "No written review."}</p>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}

			{totalPages > 1 ? (
				<nav className="mt-6 flex flex-wrap items-center justify-center gap-1" aria-label="Review pages">
					{totalPages > 5 ? (
						<>
							<Button variant="ghost" size="icon" className="size-11 rounded-full" onClick={() => goTo(1)} disabled={currentPage === 1} aria-label="First reviews page"><ChevronFirst className="size-4" /></Button>
							<Button variant="ghost" size="icon" className="size-11 rounded-full" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous reviews page"><ChevronLeft className="size-4" /></Button>
						</>
					) : null}
					{(totalPages <= 5 ? pageNumbers : displayedPages).map((number) => (
						<Button key={number} variant={number === currentPage ? "default" : "ghost"} size="icon" className="size-11 rounded-full" onClick={() => goTo(number)} aria-current={number === currentPage ? "page" : undefined} aria-label={`Reviews page ${number}`}>{number}</Button>
					))}
					{totalPages > 5 ? (
						<>
							<Button variant="ghost" size="icon" className="size-11 rounded-full" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next reviews page"><ChevronRight className="size-4" /></Button>
							<Button variant="ghost" size="icon" className="size-11 rounded-full" onClick={() => goTo(totalPages)} disabled={currentPage === totalPages} aria-label="Last reviews page"><ChevronLast className="size-4" /></Button>
						</>
					) : null}
				</nav>
			) : null}
		</section>
	);
};

export default RecipeReviewList;
