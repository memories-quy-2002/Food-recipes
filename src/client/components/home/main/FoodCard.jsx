import React from "react";
import { BsFillHeartFill, BsHeart } from "react-icons/bs";
import convertImage from "../../../utils/convertImage";
import ratingStar from "../../../utils/ratingStar";
const FoodCard = ({
	id,
	name,
	category,
	meal,
	ratings,
	score,
	favorite,
	onNavigate,
	onClickFavorite,
}) => {
	return (
		<div
			className="home__main__cardList__feature__item"
			onClick={onNavigate}
		>
			{convertImage(name, "home__main__cardList__feature__item__img")}
			<div className="home__main__cardList__feature__item__fav">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onClickFavorite(id);
					}}
					type="button"
				>
					{favorite ? (
						<BsFillHeartFill size={20} color="white" />
					) : (
						<BsHeart size={20} color="white" />
					)}
				</button>
			</div>
			<strong className="home__main__cardList__feature__item__category">
				{category.toUpperCase()}
			</strong>
			<h5 className="home__main__cardList__feature__item__name">
				{name}
			</h5>
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
		</div>
	);
};

export default FoodCard;
