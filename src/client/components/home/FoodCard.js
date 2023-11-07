import React from "react";
import { BsFillHeartFill, BsHeart } from "react-icons/bs";
import convertImage from "../../utils/convertImage";

const FoodCard = ({
	id,
	name,
	category,
	meal,
	favorite,
	handleNavigate,
	handleClickFavorite,
}) => {
	return (
		<div
			className="home__main__cardList__feature__item"
			onClick={handleNavigate}
		>
			{convertImage(name, "home__main__cardList__feature__item__img")}
			<div className="home__main__cardList__feature__item__fav">
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleClickFavorite(id);
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
			<p className="home__main__cardList__feature__item__meal">
				Meal: {meal}
			</p>
		</div>
	);
};

export default FoodCard;
