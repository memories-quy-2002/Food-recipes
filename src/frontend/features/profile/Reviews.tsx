import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";
import PageState from "@/shared/ui/PageState";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { ProfileRating } from "./profileTypes";

type ReviewsProps = { reviewsData?: ProfileRating[] };

const Reviews = ({ reviewsData = [] }: ReviewsProps): ReactElement => {
	const navigate = useNavigate();
	const comments = reviewsData.filter((review) => review.review !== "").length;
	return (
		<div>
			<header className="mb-6"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your feedback</p><h1 className="text-3xl font-black tracking-tight sm:text-4xl">My reviews</h1><p className="mt-3 text-muted-foreground">Revisit ratings and notes you have left on recipes.</p></header>
			<div className="mb-6 grid grid-cols-2 gap-3"><Card className="p-4 text-center"><strong className="block text-2xl font-black">{reviewsData.length}</strong><span className="text-sm text-muted-foreground">Ratings</span></Card><Card className="p-4 text-center"><strong className="block text-2xl font-black">{comments}</strong><span className="text-sm text-muted-foreground">Comments</span></Card></div>
			{reviewsData.length === 0 ? <PageState type="empty" title="You have not reviewed any recipes yet" message="Open a recipe, choose a rating, and leave a note for your future self." actionLabel="Browse recipes" onAction={() => navigate("/food")} /> : <ul className="grid gap-4">{reviewsData.map((review) => <li key={review.rating_id}><Card className="p-4 sm:p-5"><div className="flex items-center gap-4"><div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-32">{convertImage(review.recipe_name, "h-full w-full object-cover", review.image_url)}</div><div className="min-w-0"><h2 className="truncate font-bold">{review.recipe_name}</h2><div className="mt-2 flex items-center gap-2" aria-label={`${Number.parseInt(String(review.score), 10)} out of 5 stars`}><span className="flex gap-1">{ratingStar(review.score, "orange")}</span><span className="text-sm font-bold">{Number.parseInt(String(review.score), 10)}/5</span></div></div></div><p className="mt-4 leading-7 text-muted-foreground">{review.review || "No written review yet."}</p><div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => navigate(`/recipe?id=${review.recipe_id}`)}>Edit review</Button></div></Card></li>)}</ul>}
		</div>
	);
};
export default Reviews;
