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
		<article className="home__main__cardList__feature__item">
			<Link
				className="home__main__cardList__feature__item__link"
				to={`/recipe?id=${id}`}
				aria-label={`Open ${name}`}
			>
				{convertImage(name, "home__main__cardList__feature__item__img", imageUrl)}

				<strong className="home__main__cardList__feature__item__category">
					{category.toUpperCase()}
				</strong>
				<h4 className="home__main__cardList__feature__item__name">
					{name}
				</h4>
				<div className="home__main__cardList__feature__item__meta">
					<span>{meal}</span>
					<span>{ratings} ratings</span>
				</div>
				<div className="home__main__cardList__feature__item__rating">
					<div className="d-flex gap-1">
						{ratingStar(score, "orange")}
					</div>
					<span>{Number(score || 0).toFixed(1)}</span>
				</div>
			</Link>
			<div className="home__main__cardList__feature__item__fav">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onClickFavorite(id);
					}}
					aria-label={favorite ? "Remove from favorite" : "Add to favorite"}
					type="button"
				>
					{favorite ? (
						<BsFillHeartFill size={20} color="white" />
					) : (
						<BsHeart size={20} color="white" />
					)}
				</button>
			</div>
		</article>
	);
};

export default FoodCard;
