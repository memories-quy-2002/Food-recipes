import { BsFillHeartFill, BsHeart } from "react-icons/bs";
import { Link } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";

const FoodCard = ({
	id,
	name,
	category,
	meal,
	ratings,
	score,
	imageUrl,
	favorite,
	onClickFavorite,
}) => {
	return (
		<article className="group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
			<Link className="block focus:outline-none" to={`/recipe?id=${id}`} aria-label={`Open ${name}`}>
				<div className="relative aspect-[4/3] overflow-hidden bg-muted">
					{convertImage(name, "size-full object-cover transition duration-300 group-hover:scale-[1.03]", imageUrl)}
					<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />
				</div>

				<div className="p-4 sm:p-5">
					<p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
						{category || "Recipe"}
					</p>
					<h3 className="mt-2 line-clamp-2 min-h-[3rem] text-lg font-black leading-6 tracking-tight text-foreground sm:text-xl">
						{name}
					</h3>
					<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
						{meal ? <span>{meal}</span> : null}
						{meal ? <span aria-hidden="true">•</span> : null}
						<span>{Number(ratings || 0)} ratings</span>
					</div>
					<div className="mt-3 flex items-center gap-2" aria-label={`Rated ${Number(score || 0).toFixed(1)} out of 5`}>
						<div className="flex items-center gap-0.5" aria-hidden="true">{ratingStar(score, "#d56b00")}</div>
						<span className="text-sm font-black text-foreground">{Number(score || 0).toFixed(1)}</span>
					</div>
				</div>
			</Link>

			<button
				type="button"
				className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					onClickFavorite(id);
				}}
				aria-label={favorite ? `Remove ${name} from saved recipes` : `Save ${name}`}
			>
				{favorite ? <BsFillHeartFill size={19} aria-hidden="true" /> : <BsHeart size={19} aria-hidden="true" />}
			</button>
		</article>
	);
};

export default FoodCard;
