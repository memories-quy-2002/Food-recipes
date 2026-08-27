import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";
import PageState from "@/shared/ui/PageState";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

import { isProfileRating, type ProfileRating } from "./profileTypes";

const getApiErrorMessage = (error: unknown): string => {
	if (!isAxiosError(error)) return "Unable to load your profile reviews.";
	const data = error.response?.data;
	return typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
		? data.message
		: "Unable to load your profile reviews.";
};

const formatReviewDate = (value?: string | null): string | null => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const Reviews = (): ReactElement => {
	const navigate = useNavigate();
	const [reviewsData, setReviewsData] = useState<ProfileRating[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchReviews = useCallback(async (): Promise<void> => {
		try {
			setIsLoading(true);
			setError(null);
			const response = await axios.get<unknown>(apiRoutes.userRatings);
			setReviewsData(getArrayPayload(response.data, "ratings", isProfileRating));
		} catch (requestError: unknown) {
			setError(getApiErrorMessage(requestError));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchReviews();
	}, [fetchReviews]);

	if (isLoading) {
		return <PageState title="Loading reviews" message="Fetching your recipe reviews." />;
	}

	if (error) {
		return (
			<PageState
				type="error"
				title="Reviews could not load"
				message={error}
				actionLabel="Try again"
				onAction={fetchReviews}
			/>
		);
	}

	const comments = reviewsData.filter((review) => Boolean(review.review?.trim())).length;
	return (
		<div>
			<header className="mb-6"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">My reviews</h1><p className="sr-only">Revisit ratings and notes you have left on recipes.</p></header>
			<div className="mb-6 grid grid-cols-2 gap-3"><Card className="p-4 text-center"><strong className="block text-2xl font-black">{reviewsData.length}</strong><span className="text-sm text-muted-foreground">Ratings</span></Card><Card className="p-4 text-center"><strong className="block text-2xl font-black">{comments}</strong><span className="text-sm text-muted-foreground">Comments</span></Card></div>
			{reviewsData.length === 0 ? <PageState type="empty" title="You have not reviewed any recipes yet" message="Open a recipe, choose a rating, and leave a note for your future self." actionLabel="Browse recipes" onAction={() => navigate("/food")} /> : <ul className="grid gap-4">{reviewsData.map((review) => { const reviewDate = formatReviewDate(review.date_added); return <li key={review.rating_id}><Card className="p-4 sm:p-5"><div className="flex items-center gap-4"><div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-32">{convertImage(review.recipe_name, "h-full w-full object-cover", review.image_url)}</div><div className="min-w-0"><h2 className="truncate font-bold">{review.recipe_name}</h2><div className="mt-2 flex flex-wrap items-center gap-2" aria-label={`${Number.parseInt(String(review.score), 10)} out of 5 stars`}><span className="flex gap-1">{ratingStar(review.score, "orange")}</span><span className="text-sm font-bold">{Number.parseInt(String(review.score), 10)}/5</span>{reviewDate && <time className="text-sm text-muted-foreground" dateTime={review.date_added || undefined}>{reviewDate}</time>}</div></div></div><p className="mt-4 leading-7 text-muted-foreground">{review.review || "No written review yet."}</p><div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => navigate(`/recipe?id=${review.recipe_id}`)} aria-label={`View recipe ${review.recipe_name}`}>View recipe</Button></div></Card></li>; })}</ul>}
		</div>
	);
};
export default Reviews;
